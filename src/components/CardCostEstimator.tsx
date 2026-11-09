import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardPaste, Info, Loader2, ReceiptText, WalletCards } from 'lucide-react';
import { parseBankMessage } from '../services/bankMessage';
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
  /** The user's own currency (Converter base): the default card currency */
  homeCurrency: string;
  bankFeePct: number;
  onUseAsFee: (pct: number) => void;
  /** Currencies the user's cards are likely in, most likely first (for reading bank messages) */
  cardCurrencies: string[];
  /** Currency codes a bank message may contain */
  knownCodes: ReadonlySet<string>;
  onSaveCard: (card: { name: string; currency: string; feePct: number }) => void;
  /** Text shared to the app; a new nonce fills the form again */
  prefill?: { text: string; nonce: number } | null;
}

type PasteStatus = null | { kind: 'filled' } | { kind: 'one'; amount: string } | { kind: 'nothing' };

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

const isFiat = (code: string) => FIAT.some(c => c.code === code);

export const CardCostEstimator: React.FC<CardCostEstimatorProps> = ({
  defaultPurchaseCurrency, homeCurrency, bankFeePct, onUseAsFee, cardCurrencies, knownCodes, onSaveCard, prefill,
}) => {
  const { t, lang, locale, pct, currency } = useT();
  // The card is in the user's own currency; the purchase in another one
  const [cardCur, setCardCur] = useState(() => (isFiat(homeCurrency) ? homeCurrency : 'USD'));
  const [purchaseCur, setPurchaseCur] = useState(() => {
    const card = isFiat(homeCurrency) ? homeCurrency : 'USD';
    if (isFiat(defaultPurchaseCurrency) && defaultPurchaseCurrency !== card) return defaultPurchaseCurrency;
    return card === 'EUR' ? 'USD' : 'EUR';
  });
  const [purchaseText, setPurchaseText] = useState('');
  const [chargedText, setChargedText] = useState('');
  const [date, setDate] = useState(localToday);
  const [official, setOfficial] = useState<Official>({ status: 'loading' });
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteStatus, setPasteStatus] = useState<PasteStatus>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [cardName, setCardName] = useState('');
  const [savedName, setSavedName] = useState<string | null>(null);

  // Amounts go back into the fields the way the user would type them
  const asInput = (n: number) => (lang === 'uk' ? String(n).replace('.', ',') : String(n));

  const applyMessage = (text: string) => {
    const msg = parseBankMessage(text, knownCodes, cardCurrencies);
    if (!msg) {
      setPasteStatus({ kind: 'nothing' });
      return;
    }
    if (!msg.charged) {
      // One amount: in the card's currency it's the charge, otherwise the purchase
      const isCharge = cardCurrencies.includes(msg.purchase.currency);
      if (isFiat(msg.purchase.currency)) {
        if (isCharge) { setCardCur(msg.purchase.currency); setChargedText(asInput(msg.purchase.amount)); }
        else { setPurchaseCur(msg.purchase.currency); setPurchaseText(asInput(msg.purchase.amount)); }
      }
      setPasteStatus({ kind: 'one', amount: `${formatCurrencyAmount(msg.purchase.amount, 2, false, '', locale)} ${msg.purchase.currency}` });
    } else {
      if (isFiat(msg.purchase.currency)) setPurchaseCur(msg.purchase.currency);
      if (isFiat(msg.charged.currency)) setCardCur(msg.charged.currency);
      setPurchaseText(asInput(msg.purchase.amount));
      setChargedText(asInput(msg.charged.amount));
      setPasteStatus({ kind: 'filled' });
    }
    if (msg.date && msg.date <= localToday()) setDate(msg.date);
    setSavedName(null);
  };

  useEffect(() => {
    if (!prefill) return;
    setPasteText(prefill.text);
    setPasteOpen(true);
    applyMessage(prefill.text);
    // Only a new share should refill the form
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill?.nonce]);

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

        {/* Paste a bank notification or SMS instead of typing (sharing one to the app fills this too) */}
        {!pasteOpen ? (
          <button
            onClick={() => { StorageService.triggerHaptic(); setPasteOpen(true); }}
            className="w-full py-2.5 rounded-[16px] bg-inset text-sm font-bold text-ink flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <ClipboardPaste className="w-4 h-4" />{t('est.paste')}
          </button>
        ) : (
          <div className="space-y-1.5">
            <textarea
              value={pasteText}
              onChange={e => { setPasteText(e.target.value); if (e.target.value.trim()) applyMessage(e.target.value); else setPasteStatus(null); }}
              placeholder={t('est.pastePlaceholder')}
              rows={3}
              aria-label={t('est.paste')}
              className="w-full bg-inset rounded-[16px] px-4 py-3 text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
            />
            {pasteStatus && (
              <p className={'text-xs ' + (pasteStatus.kind === 'filled' ? 'text-emerald-600' : 'text-amber-700')}>
                {pasteStatus.kind === 'filled' ? t('est.pasteFilled')
                  : pasteStatus.kind === 'one' ? t('est.pasteOneAmount', { amount: pasteStatus.amount })
                  : t('est.pasteNothing')}
              </p>
            )}
            {!pasteStatus && <p className="text-[11px] text-muted">{t('est.shareHint')}</p>}
          </div>
        )}

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

            {/* Save the measured fee as a named card, to compare cards later */}
            {Math.abs(estimate.markupPct) <= IMPLAUSIBLE_MARKUP_PCT && (
              savedName ? (
                <p className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-2 py-1">
                  <CheckCircle2 className="w-4 h-4" />{t('est.cardSaved', { name: savedName })}
                </p>
              ) : !saveOpen ? (
                <button
                  onClick={() => { StorageService.triggerHaptic(); setSaveOpen(true); }}
                  className="w-full py-3 rounded-[16px] text-sm font-bold bg-inset text-ink flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <WalletCards className="w-4 h-4" />{t('est.saveCard')}
                </button>
              ) : (
                <form
                  className="flex gap-2"
                  onSubmit={e => {
                    e.preventDefault();
                    const name = cardName.trim();
                    if (!name) return;
                    StorageService.triggerHaptic();
                    onSaveCard({ name, currency: cardCur, feePct: Math.max(0, estimate.markupPct) });
                    setSavedName(name);
                    setSaveOpen(false);
                  }}
                >
                  <input
                    autoFocus
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    maxLength={40}
                    placeholder={t('est.cardName')}
                    aria-label={t('est.cardName')}
                    className="min-w-0 flex-1 bg-inset rounded-[16px] px-4 py-3 text-sm font-bold text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <button type="submit" disabled={!cardName.trim()} className="shrink-0 px-5 rounded-[16px] text-sm font-bold bg-accent text-onaccent disabled:opacity-40">
                    {t('est.save')}
                  </button>
                </form>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};
