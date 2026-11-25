import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, CheckCircle2, Copy, Info, Pencil, Plus, Trash2, X } from 'lucide-react';
import { ALL_CURRENCIES } from '../data/currencies';
import { useT } from '../i18n';
import { ExchangeRateData } from '../types/currency';
import { RateService } from '../services/rateService';
import { StorageService } from '../services/storageService';
import { formatCurrencyAmount } from '../services/feeCalculator';
import { parseAmount } from '../services/cardCostEstimator';
import { shareText } from '../services/appActions';
import {
  AtmWithdrawal, ATM_CARD_FEE_KEY, addWithdrawal, formatMonthSummaryText,
  loadWithdrawals, monthTotals, removeWithdrawal, storeWithdrawals,
  toggleWithdrawalRefunded, updateWithdrawal, withdrawalCost,
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
    return n ? (lang === 'en' ? String(n) : String(n).replace('.', ',')) : '0';
  });
  const [date, setDate] = useState(localToday);
  const [list, setListState] = useState<AtmWithdrawal[]>(loadWithdrawals);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedMonth, setCopiedMonth] = useState<string | null>(null);
  const [historicalRate, setHistoricalRate] = useState<{
    date: string;
    cash: string;
    home: string;
    source: 'nbu' | 'ecb';
    rate: number;
  } | null>(null);
  const setList = (next: AtmWithdrawal[]) => { setListState(next); storeWithdrawals(next); };

  const asInput = (n: number) => (lang === 'en' ? String(n) : String(n).replace('.', ','));

  useEffect(() => {
    const today = localToday();
    if (date >= today || cashCur === home) {
      setHistoricalRate(null);
      return;
    }
    let cancelled = false;
    RateService.getOfficialRates(cashCur, home, [date]).then(res => {
      if (cancelled) return;
      if (res && res.rates[0]?.rate > 0) {
        setHistoricalRate({ date, cash: cashCur, home, source: res.source, rate: res.rates[0].rate });
      } else {
        setHistoricalRate(null);
      }
    });
    return () => { cancelled = true; };
  }, [date, cashCur, home]);

  const money = (n: number, code: string) => {
    const c = currency(code);
    return formatCurrencyAmount(n, c.decimalPlaces, true, c.symbol, locale);
  };

  const amount = parseAmount(amountText, lang);
  const atmFee = feeText.trim() === '' ? 0 : parseAmount(feeText, lang);
  const cardFeePct = cardFeeText.trim() === '' ? 0 : parseAmount(cardFeeText, lang);
  const cardFeeOk = cardFeePct >= 0 && cardFeePct <= 20;

  const activeHistorical = historicalRate &&
    historicalRate.date === date &&
    historicalRate.cash === cashCur &&
    historicalRate.home === home
      ? historicalRate
      : null;

  // Use historical official rate when backdated, else market mid-rate
  const liveMidRate = rateData ? RateService.calculateRate(cashCur, home, rateData, false) : NaN;
  const rate = activeHistorical ? activeHistorical.rate : liveMidRate;
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
    const input = { date, currency: cashCur, amount, atmFee, homeCurrency: home, rate, cardFeePct };
    if (editingId) {
      setList(updateWithdrawal(list, editingId, input));
      setEditingId(null);
      setStatusMessage(t('atm.updated'));
    } else {
      setList(addWithdrawal(list, input));
      setStatusMessage(t('atm.saved'));
    }
    try { localStorage.setItem(ATM_CARD_FEE_KEY, String(cardFeePct)); } catch {}
    setAmountText('');
    setFeeText('');
  };

  const startEdit = (w: AtmWithdrawal) => {
    StorageService.triggerHaptic();
    setEditingId(w.id);
    setCashCur(w.currency);
    setAmountText(asInput(w.amount));
    setFeeText(w.atmFee > 0 ? asInput(w.atmFee) : '');
    setCardFeeText(asInput(w.cardFeePct));
    setDate(w.date);
    setStatusMessage(null);
  };

  const cancelEdit = () => {
    StorageService.triggerHaptic();
    setEditingId(null);
    setAmountText('');
    setFeeText('');
    setDate(localToday());
  };

  const copyMonthSummary = async (m: typeof months[number]) => {
    StorageService.triggerHaptic();
    const title = monthName(m.month);
    const text = formatMonthSummaryText(m, title, money, {
      pending: t('atm.pending'),
      refunded: t('atm.refunded'),
      totalRefunds: t('atm.totalRefundsLabel'),
      feeLabel: t('atm.atmFeeLine'),
    });
    await shareText(text, title);
    const key = m.month + m.homeCurrency;
    setCopiedMonth(key);
    setTimeout(() => setCopiedMonth(prev => (prev === key ? null : prev)), 2000);
  };

  const field = 'w-full bg-inset rounded-[16px] px-4 py-3 text-sm font-bold text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/20';
  const label = 'text-[10px] font-bold uppercase tracking-wider text-muted block mb-1';
  const cashSymbol = currency(cashCur).symbol;

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-[24px] bg-card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-full bg-inset flex items-center justify-center text-ink">
              <Banknote className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-ink leading-tight">{t('atm.title')}</h3>
              <p className="text-xs text-muted mt-0.5">{t('atm.subtitle', { code: home })}</p>
            </div>
          </div>
          {editingId && (
            <button
              onClick={cancelEdit}
              aria-label={t('common.cancel')}
              className="p-2 rounded-full bg-inset text-muted hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div>
          <label className={label} htmlFor="atm-amount">{t('atm.amount')}</label>
          <div className="flex gap-2">
            <select
              value={cashCur}
              onChange={e => { StorageService.triggerHaptic(); setCashCur(e.target.value); setStatusMessage(null); }}
              aria-label={t('atm.cashCurrency')}
              className="shrink-0 w-[104px] bg-inset rounded-[16px] px-3 text-sm font-bold text-ink focus:outline-none"
            >
              {FIAT.map(c => <option key={'atm-' + c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
            <input
              id="atm-amount"
              value={amountText}
              onChange={e => { setAmountText(e.target.value); setStatusMessage(null); }}
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
              onChange={e => { setFeeText(e.target.value); setStatusMessage(null); }}
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
              onChange={e => { setCardFeeText(e.target.value); setStatusMessage(null); }}
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
        {statusMessage && <p className="text-sm text-emerald-600 font-bold" role="status">{statusMessage}</p>}
        {cashCur === home ? (
          <p className="text-sm text-muted">{t('atm.sameCurrency', { code: home })}</p>
        ) : !(rate > 0) ? (
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

            <p className="text-xs text-muted">
              {activeHistorical
                ? t('atm.historicalRateNote', {
                    source: t(`est.source.${activeHistorical.source}`),
                    date: dayName(activeHistorical.date),
                    rate: `1 ${cashCur} = ${rate.toLocaleString(locale, { maximumSignificantDigits: 5 })} ${home}`,
                  })
                : t('atm.rateNote', {
                    rate: `1 ${cashCur} = ${rate.toLocaleString(locale, { maximumSignificantDigits: 5 })} ${home}`,
                  })}
            </p>

            <div className="flex gap-2">
              {editingId && (
                <button
                  onClick={cancelEdit}
                  className="px-4 py-3 rounded-[16px] bg-inset text-sm font-bold text-ink2 active:scale-[0.98]"
                >
                  {t('common.cancel')}
                </button>
              )}
              <button
                onClick={save}
                className="flex-1 py-3 rounded-[16px] bg-inset text-sm font-bold text-ink flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />{editingId ? t('atm.saveChanges') : t('atm.save')}
              </button>
            </div>
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
          months.map(m => {
            const monthKey = m.month + m.homeCurrency;
            const isCopied = copiedMonth === monthKey;
            return (
              <div key={monthKey} className="space-y-2">
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-sm font-extrabold text-ink capitalize">{monthName(m.month)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-black text-accent whitespace-nowrap">
                      {money(m.refundedCount > 0 ? m.pendingRefund : m.refund, m.homeCurrency)}
                    </span>
                    <button
                      onClick={() => copyMonthSummary(m)}
                      aria-label={t('atm.copySummary')}
                      title={t('atm.copySummary')}
                      className="px-2 py-1 rounded-full bg-inset text-[11px] font-bold text-ink2 flex items-center gap-1 active:scale-95"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{isCopied ? t('atm.summaryCopied') : t('atm.copySummary')}</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted -mt-1">
                  {t(m.count === 1 ? 'atm.monthSummaryOne' : 'atm.monthSummary', { count: String(m.count), total: money(m.total, m.homeCurrency) })}
                </p>
                {m.refundedCount > 0 && (
                  <p className="text-xs text-emerald-600 font-semibold -mt-1">
                    {t('atm.pendingSummary', {
                      pending: money(m.pendingRefund, m.homeCurrency),
                      refunded: money(m.refundedAmount, m.homeCurrency),
                    })}
                  </p>
                )}
                <ul className="space-y-1.5">
                  {m.withdrawals.map(w => (
                    <li key={w.id} className="flex items-stretch gap-1.5">
                      <button
                        onClick={() => {
                          StorageService.triggerHaptic();
                          setList(toggleWithdrawalRefunded(list, w.id));
                        }}
                        aria-label={t('atm.markRefunded')}
                        title={t('atm.markRefunded')}
                        className={'shrink-0 w-10 rounded-[16px] flex items-center justify-center active:scale-95 transition-colors ' + (w.refunded ? 'bg-emerald-500/20 text-emerald-600' : 'bg-inset text-muted')}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <div className={'min-w-0 flex-1 rounded-[16px] bg-inset px-3.5 py-2.5 ' + (w.refunded ? 'opacity-65' : '')}>
                        <div className="flex justify-between gap-2 text-sm">
                          <span className="font-bold text-ink truncate">{dayName(w.date)} · {money(w.amount, w.currency)}</span>
                          <span className={'font-mono font-bold whitespace-nowrap ' + (w.refunded ? 'line-through text-muted' : 'text-ink')}>
                            {money(w.refundHome, w.homeCurrency)}
                          </span>
                        </div>
                        <div className="text-xs text-muted mt-0.5 truncate">
                          {t('atm.entryDetail', { fee: money(w.atmFee, w.currency), total: money(w.totalHome, w.homeCurrency) })}
                          {w.refunded ? ` · ${t('atm.refunded')}` : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => startEdit(w)}
                        aria-label={t('atm.edit')}
                        title={t('atm.edit')}
                        className="shrink-0 w-10 rounded-[16px] bg-inset text-muted flex items-center justify-center active:scale-95"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          StorageService.triggerHaptic();
                          if (editingId === w.id) cancelEdit();
                          setList(removeWithdrawal(list, w.id));
                        }}
                        aria-label={t('atm.remove', { date: dayName(w.date), amount: money(w.amount, w.currency) })}
                        className="shrink-0 w-10 rounded-[16px] bg-inset text-muted flex items-center justify-center active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
        {months.length > 0 && <p className="text-xs text-muted">{t('atm.logNote')}</p>}
      </div>
    </div>
  );
};
