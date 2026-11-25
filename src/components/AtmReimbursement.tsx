import React, { useMemo, useState } from 'react';
import { Banknote, Info, Plus, Trash2 } from 'lucide-react';
import { ALL_CURRENCIES } from '../data/currencies';
import { useT } from '../i18n';
import { ExchangeRateData } from '../types/currency';
import { RateService } from '../services/rateService';
import { StorageService } from '../services/storageService';
import { formatCurrencyAmount } from '../services/feeCalculator';
import { parseAmount } from '../services/cardCostEstimator';
import {
  AtmWithdrawal, ATM_CARD_FEE_KEY, addWithdrawal, loadWithdrawals, monthTotals,
  removeWithdrawal, storeWithdrawals, withdrawalCost,
} from '../services/atmWithdrawals';

interface AtmReimbursementProps {
  rateData: ExchangeRateData | null;
  /** The user's own currency (Converter base): the card's currency */
  homeCurrency: string;
  /** The currency the user is most likely withdrawing (Converter's top currency) */
  defaultCashCurrency: string;
}

const FIAT = [...ALL_CURRENCIES].filter(c => c.type === 'fiat').sort((a, b) => a.code.localeCompare(b.code));
const isFiat = (code: string) => FIAT.some(c => c.code === code);

/** Today's date in the phone's time zone, as YYYY-MM-DD */
const localToday = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const loadCardFee = () => {
  try {
    const n = parseFloat(localStorage.getItem(ATM_CARD_FEE_KEY) || '0');
    return isFinite(n) && n >= 0 && n <= 20 ? n : 0;
  } catch {
    return 0;
  }
};

/** ATM withdrawals abroad: what the card is charged and the ATM fee a fee-refunding card (e.g. Schwab) pays back */
export const AtmReimbursement: React.FC<AtmReimbursementProps> = ({ rateData, homeCurrency, defaultCashCurrency }) => {
  const { t, lang, locale, pct, currency } = useT();
  const home = isFiat(homeCurrency) ? homeCurrency : 'USD';
  const [cashCur, setCashCur] = useState(() => {
    if (isFiat(defaultCashCurrency) && defaultCashCurrency !== home) return defaultCashCurrency;
    return home === 'EUR' ? 'USD' : 'EUR';
  });
  const [amountText, setAmountText] = useState('');
  const [feeText, setFeeText] = useState('');
  const [cardFeeText, setCardFeeText] = useState(() => {
    const n = loadCardFee();
    return n ? (lang === 'uk' ? String(n).replace('.', ',') : String(n)) : '0';
  });
  const [date, setDate] = useState(localToday);
  const [list, setListState] = useState<AtmWithdrawal[]>(loadWithdrawals);
  const [justSaved, setJustSaved] = useState(false);
  const setList = (next: AtmWithdrawal[]) => { setListState(next); storeWithdrawals(next); };

  const money = (n: number, code: string) => {
    const c = currency(code);
    return formatCurrencyAmount(n, c.decimalPlaces, true, c.symbol, locale);
  };

  const amount = parseAmount(amountText, lang);
  const atmFee = feeText.trim() === '' ? 0 : parseAmount(feeText, lang);
  const cardFeePct = cardFeeText.trim() === '' ? 0 : parseAmount(cardFeeText, lang);
  const cardFeeOk = cardFeePct >= 0 && cardFeePct <= 20;
  // Card networks convert close to the market mid-rate; the card's own fee is added separately
  const rate = rateData ? RateService.calculateRate(cashCur, home, rateData, false) : NaN;
  const cost = cardFeeOk ? withdrawalCost(amount, atmFee, rate, cardFeePct) : null;

  const months = useMemo(() => monthTotals(list), [list]);
  const monthName = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  };
  const dayName = (ymd: string) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  };

  const save = () => {
    if (!cost) return;
    StorageService.triggerHaptic();
    setList(addWithdrawal(list, { date, currency: cashCur, amount, atmFee, homeCurrency: home, rate, cardFeePct }));
    try { localStorage.setItem(ATM_CARD_FEE_KEY, String(cardFeePct)); } catch {}
    setAmountText('');
    setFeeText('');
    setJustSaved(true);
  };

  const field = 'w-full bg-inset rounded-[16px] px-4 py-3 text-sm font-bold text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/20';
  const label = 'text-[10px] font-bold uppercase tracking-wider text-muted block mb-1';
  const cashSymbol = currency(cashCur).symbol;

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-[24px] bg-card space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-full bg-inset flex items-center justify-center text-ink">
            <Banknote className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-ink leading-tight">{t('atm.title')}</h3>
            <p className="text-xs text-muted mt-0.5">{t('atm.subtitle', { code: home })}</p>
          </div>
        </div>

        <div>
          <label className={label} htmlFor="atm-amount">{t('atm.amount')}</label>
          <div className="flex gap-2">
            <select
              value={cashCur}
              onChange={e => { StorageService.triggerHaptic(); setCashCur(e.target.value); setJustSaved(false); }}
              aria-label={t('atm.cashCurrency')}
              className="shrink-0 w-[104px] bg-inset rounded-[16px] px-3 text-sm font-bold text-ink focus:outline-none"
            >
              {FIAT.map(c => <option key={'atm-' + c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
            <input
              id="atm-amount"
              value={amountText}
              onChange={e => { setAmountText(e.target.value); setJustSaved(false); }}
              inputMode="decimal"
              placeholder="200"
              className={field + ' min-w-0 flex-1 font-mono text-lg'}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label} htmlFor="atm-fee">{t('atm.fee', { code: cashCur })}</label>
            <input
              id="atm-fee"
              value={feeText}
              onChange={e => { setFeeText(e.target.value); setJustSaved(false); }}
              inputMode="decimal"
              placeholder={cashSymbol + ' 0'}
              className={field + ' font-mono'}
            />
          </div>
          <div>
            <label className={label} htmlFor="atm-card-fee">{t('atm.cardFee')}</label>
            <input
              id="atm-card-fee"
              value={cardFeeText}
              onChange={e => { setCardFeeText(e.target.value); setJustSaved(false); }}
              inputMode="decimal"
              placeholder="0"
              className={field + ' font-mono'}
            />
          </div>
        </div>

        <div>
          <label className={label} htmlFor="atm-date">{t('atm.date')}</label>
          <input
            id="atm-date"
            type="date"
            value={date}
            max={localToday()}
            onChange={e => e.target.value && setDate(e.target.value)}
            className={field}
          />
        </div>
      </div>

      <div className="p-5 rounded-[24px] bg-card space-y-3">
        {justSaved && <p className="text-sm text-emerald-600 font-bold" role="status">{t('atm.saved')}</p>}
        {cashCur === home ? (
          <p className="text-sm text-muted">{t('atm.sameCurrency', { code: home })}</p>
        ) : !rateData || !(rate > 0) ? (
          <p className="text-sm text-muted">{t('atm.noRate', { from: cashCur, to: home })}</p>
        ) : !cost ? (
          <p className="text-sm text-muted">{t(cardFeeOk ? 'atm.enterAmount' : 'atm.badCardFee')}</p>
        ) : (
          <>
            <div className="rounded-[20px] bg-accent text-onaccent p-4">
              <div className="text-xs font-bold opacity-80">{t('atm.refund')}</div>
              <div className="font-mono font-black text-3xl mt-0.5">{money(cost.atmFeeHome, home)}</div>
              <div className="text-xs opacity-80 mt-1">
                {atmFee > 0 ? t('atm.refundOf', { fee: money(atmFee, cashCur) }) : t('atm.noAtmFee')}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3 text-ink2">
                <span>{t('atm.cash', { amount: money(amount, cashCur) })}</span>
                <span className="font-mono font-bold text-ink whitespace-nowrap">{money(cost.cashHome, home)}</span>
              </div>
              <div className="flex justify-between gap-3 text-ink2">
                <span>{t('atm.atmFeeLine')}</span>
                <span className="font-mono font-bold text-ink whitespace-nowrap">{money(cost.atmFeeHome, home)}</span>
              </div>
              {cardFeePct > 0 && (
                <div className="flex justify-between gap-3 text-muted text-xs">
                  <span>{t('atm.cardFeeIncluded', { pct: pct(cardFeePct, 2) })}</span>
                  <span className="font-mono whitespace-nowrap">{money(cost.cardFeeHome, home)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-line/[0.08] flex justify-between gap-3">
                <span className="font-extrabold text-ink">{t('atm.total')}</span>
                <span className="font-mono font-black text-ink whitespace-nowrap">{money(cost.totalHome, home)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-extrabold text-ink">{t('atm.afterRefund')}</span>
                <span className="font-mono font-black text-emerald-600 whitespace-nowrap">{money(cost.afterRefundHome, home)}</span>
              </div>
            </div>

            <p className="text-xs text-muted">{t('atm.rateNote', { rate: `1 ${cashCur} = ${rate.toLocaleString(locale, { maximumSignificantDigits: 5 })} ${home}` })}</p>

            <button
              onClick={save}
              className="w-full py-3 rounded-[16px] bg-inset text-sm font-bold text-ink flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />{t('atm.save')}
            </button>
          </>
        )}

        <div className="flex gap-2 p-3 rounded-[16px] bg-inset text-xs text-ink2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-muted" />
          <span>{t('atm.dccTip', { cash: cashCur === home ? t('atm.localCurrency') : cashCur, home })}</span>
        </div>
      </div>

      <div className="p-5 rounded-[24px] bg-card space-y-3">
        <h3 className="text-base font-extrabold text-ink leading-tight">{t('atm.logTitle')}</h3>
        {months.length === 0 ? (
          <p className="text-sm text-muted leading-relaxed">{t('atm.logEmpty')}</p>
        ) : (
          months.map(m => (
            <div key={m.month + m.homeCurrency} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2 pt-1">
                <span className="text-sm font-extrabold text-ink capitalize">{monthName(m.month)}</span>
                <span className="text-sm font-mono font-black text-accent whitespace-nowrap">{money(m.refund, m.homeCurrency)}</span>
              </div>
              <p className="text-xs text-muted -mt-1">
                {t(m.count === 1 ? 'atm.monthSummaryOne' : 'atm.monthSummary', { count: String(m.count), total: money(m.total, m.homeCurrency) })}
              </p>
              <ul className="space-y-1.5">
                {m.withdrawals.map(w => (
                  <li key={w.id} className="flex items-stretch gap-2">
                    <div className="min-w-0 flex-1 rounded-[16px] bg-inset px-4 py-2.5">
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="font-bold text-ink truncate">{dayName(w.date)} · {money(w.amount, w.currency)}</span>
                        <span className="font-mono font-bold text-ink whitespace-nowrap">{money(w.refundHome, w.homeCurrency)}</span>
                      </div>
                      <div className="text-xs text-muted mt-0.5 truncate">
                        {t('atm.entryDetail', { fee: money(w.atmFee, w.currency), total: money(w.totalHome, w.homeCurrency) })}
                      </div>
                    </div>
                    <button
                      onClick={() => { StorageService.triggerHaptic(); setList(removeWithdrawal(list, w.id)); }}
                      aria-label={t('atm.remove', { date: dayName(w.date), amount: money(w.amount, w.currency) })}
                      className="shrink-0 w-11 rounded-[16px] bg-inset text-muted flex items-center justify-center active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
        {months.length > 0 && <p className="text-xs text-muted">{t('atm.logNote')}</p>}
      </div>
    </div>
  );
};
