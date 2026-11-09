import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Info, Loader2, ReceiptText } from 'lucide-react';
import { ALL_CURRENCIES } from '../data/currencies';
import { useT } from '../i18n';
import { RateService } from '../services/rateService';
import { StorageService } from '../services/storageService';
import { formatCurrencyAmount, formatRate } from '../services/feeCalculator';
import {
  estimateCardCost, parseAmount, presetFromEstimate, settlementDates,
  DOUBLE_CONVERSION_HINT_PCT, IMPLAUSIBLE_MARKUP_PCT, ReferenceRate,
} from '../services/cardCostEstimator';

interface CardCostEstimatorProps {
  defaultPurchaseCurrency: string;
  defaultCardCurrency: string;
  bankFeePct: number;
  onUseAsFee: (pct: number) => void;
}

type Official =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'same' }
  | { status: 'ok'; source: 'nbu' | 'ecb'; rates: ReferenceRate[] };

/** Today's date in the phone's time zone, as YYYY-MM-DD */
const localToday = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

// Only fiat currencies have official rates
const FIAT = [...ALL_CURRENCIES].filter(c => c.type === 'fiat').sort((a, b) => a.code.localeCompare(b.code));

export const CardCostEstimator: React.FC<CardCostEstimatorProps> = ({
  defaultPurchaseCurrency, defaultCardCurrency, bankFeePct, onUseAsFee,
}) => {
  const { t, lang, locale, pct, currency } = useT();
  const fiatOr = (code: string, fallback: string) => (FIAT.some(c => c.code === code) ? code : fallback);
  // A hryvnia card is the common case: when either currency is UAH, it's the card's currency
  const hasUah = defaultPurchaseCurrency === 'UAH' || defaultCardCurrency === 'UAH';
  const otherCode = defaultPurchaseCurrency === 'UAH' ? defaultCardCurrency : defaultPurchaseCurrency;
  const [purchaseCur, setPurchaseCur] = useState(() =>
    hasUah ? fiatOr(otherCode === 'UAH' ? 'EUR' : otherCode, 'EUR') : fiatOr(defaultPurchaseCurrency, 'EUR'));
  const [cardCur, setCardCur] = useState(() => (hasUah ? 'UAH' : fiatOr(defaultCardCurrency, 'UAH')));
  const [purchaseText, setPurchaseText] = useState('');
  const [chargedText, setChargedText] = useState('');
  const [date, setDate] = useState(localToday);
  const [official, setOfficial] = useState<Official>({ status: 'loading' });

  useEffect(() => {
    if (purchaseCur === cardCur) {
      setOfficial({ status: 'same' });
      return;
    }
    let cancelled = false;
    setOfficial({ status: 'loading' });
    RateService.getOfficialRates(purchaseCur, cardCur, settlementDates(date, localToday())).then(res => {
      if (cancelled) return;
      setOfficial(res && res.rates.length > 0 ? { status: 'ok', ...res } : { status: 'error' });
    });
    return () => { cancelled = true; };
  }, [purchaseCur, cardCur, date]);

  const purchaseAmount = parseAmount(purchaseText, lang);
  const chargedAmount = parseAmount(chargedText, lang);
  const estimate = useMemo(
    () => (official.status === 'ok' ? estimateCardCost(purchaseAmount, chargedAmount, official.rates) : null),
    [official, purchaseAmount, chargedAmount]
  );

  const card = currency(cardCur);
  const money = (n: number) => formatCurrencyAmount(Math.abs(n), card.decimalPlaces, true, card.symbol, locale);
  const signedPct = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + pct(Math.abs(n), 1);
  const shortDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const preset = estimate ? presetFromEstimate(estimate.markupPct) : 0;
  const alreadyUsed = !!estimate && Math.abs(bankFeePct - preset) < 0.05;

  const amountField = (
    label: string, text: string, setText: (s: string) => void,
    code: string, setCode: (s: string) => void, id: string
  ) => (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-muted block mb-1.5">{label}</label>
      <div className="flex items-stretch gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="0.00"
          className="min-w-0 flex-1 bg-inset rounded-[16px] px-4 py-3 font-mono font-bold text-xl text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <select
          value={code}
          onChange={e => { StorageService.triggerHaptic(); setCode(e.target.value); }}
          aria-label={label}
          className="shrink-0 w-[104px] bg-inset rounded-[16px] px-3 text-sm font-bold text-ink focus:outline-none"
        >
          {FIAT.map(c => <option key={id + c.code} value={c.code}>{c.flag} {c.code}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="p-5 rounded-[24px] bg-card space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-full bg-inset flex items-center justify-center text-ink">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-ink leading-tight">{t('est.title')}</h2>
            <p className="text-xs text-muted mt-1 leading-relaxed">{t('est.subtitle')}</p>
          </div>
        </div>

        {amountField(t('est.purchase'), purchaseText, setPurchaseText, purchaseCur, setPurchaseCur, 'est-purchase')}
        {amountField(t('est.charged'), chargedText, setChargedText, cardCur, setCardCur, 'est-charged')}

        <div>
          <label htmlFor="est-date" className="text-xs font-semibold text-muted block mb-1.5">{t('est.date')}</label>
          <div className="flex items-center gap-2 bg-inset rounded-[16px] px-4">
            <CalendarDays className="w-4 h-4 text-muted shrink-0" />
            <input
              id="est-date"
              type="date"
              value={date}
              max={localToday()}
              onChange={e => e.target.value && setDate(e.target.value)}
              className="flex-1 min-w-0 bg-transparent py-3 text-sm font-bold text-ink focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="p-5 rounded-[24px] bg-card space-y-3" aria-live="polite">
        {official.status === 'same' ? (
          <p className="text-sm text-muted">{t('est.sameCurrency')}</p>
        ) : official.status === 'loading' ? (
          <p className="text-sm text-muted flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('est.loading')}</p>
        ) : official.status === 'error' ? (
          <p className="text-sm text-rose-600 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{t('est.noRate', { from: purchaseCur, to: cardCur })}
          </p>
        ) : !estimate ? (
          <p className="text-sm text-muted">{t('est.enterAmounts')}</p>
        ) : (
          <>
            <div>
              <p className="text-xs font-semibold text-muted">{t('est.result')}</p>
              <p className="flex items-baseline gap-2 flex-wrap">
                <span className={'font-black text-5xl tracking-tight ' + (estimate.markupPct < 0 ? 'text-emerald-600' : 'text-ink')}>
                  {signedPct(estimate.markupPct)}
                </span>
                <span className="text-sm font-semibold text-muted">{t('est.overOfficial')}</span>
              </p>
              <p className="text-sm font-bold text-ink2 mt-1">
                {t(estimate.extraCost >= 0 ? 'est.extra' : 'est.saved', { amount: money(estimate.extraCost) })}
              </p>
              {estimate.maxPct - estimate.minPct >= 0.05 && (
                <p className="text-xs text-muted mt-1">
                  {t('est.range', { min: signedPct(estimate.minPct), max: signedPct(estimate.maxPct) })}
                </p>
              )}
            </div>

            <div className="rounded-[16px] bg-inset p-3 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between gap-3">
                <span className="text-muted font-sans">{t('est.yourRate')}</span>
                <span className="font-bold text-ink text-right">1 {purchaseCur} = {formatRate(estimate.effectiveRate, locale)} {cardCur}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted font-sans">
                  {t('est.officialRate', { source: t(`est.source.${official.source}`), date: shortDate(official.rates[0].date) })}
                </span>
                <span className="font-bold text-ink text-right">1 {purchaseCur} = {formatRate(estimate.referenceRate, locale)} {cardCur}</span>
              </div>
            </div>

            {Math.abs(estimate.markupPct) > IMPLAUSIBLE_MARKUP_PCT ? (
              <p className="text-xs text-amber-700 bg-amber-500/10 rounded-[14px] p-3 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />{t('est.implausible')}
              </p>
            ) : estimate.markupPct > DOUBLE_CONVERSION_HINT_PCT && purchaseCur !== 'USD' && cardCur !== 'USD' ? (
              <p className="text-xs text-amber-700 bg-amber-500/10 rounded-[14px] p-3 flex gap-2">
                <Info className="w-4 h-4 shrink-0" />
                {t('est.doubleHint', { pct: pct(DOUBLE_CONVERSION_HINT_PCT, 0), code: purchaseCur, card: cardCur })}
              </p>
            ) : estimate.markupPct < 0 ? (
              <p className="text-xs text-emerald-700 bg-emerald-500/10 rounded-[14px] p-3">{t('est.better')}</p>
            ) : null}

            <p className="text-[11px] text-muted leading-relaxed">{t('est.note')}</p>

            {estimate.markupPct > 0 && estimate.markupPct <= IMPLAUSIBLE_MARKUP_PCT && (
              <button
                onClick={() => { StorageService.triggerHaptic(); onUseAsFee(preset); }}
                disabled={alreadyUsed}
                className={'w-full py-3.5 rounded-[16px] text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 ' +
                  (alreadyUsed ? 'bg-inset text-ink2' : 'bg-accent text-onaccent')}
              >
                {alreadyUsed ? <><CheckCircle2 className="w-4 h-4" />{t('est.used')}</> : t('est.use', { pct: pct(preset, 1) })}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
