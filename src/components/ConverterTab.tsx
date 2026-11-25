import React, { useState, useMemo } from 'react';
import {
  ArrowRightLeft, Plus, Trash2, Check, Copy,
  TrendingUp, Percent, Star, ChevronRight, ChevronDown, Clock, ShieldCheck, ScanLine, X
} from 'lucide-react';
import { ExchangeRateData } from '../types/currency';
import { useT } from '../i18n';
import { RateService } from '../services/rateService';
import {
  formatCurrencyAmount,
  calculateBankFeeConversion,
  formatRate,
  evaluateMathExpression,
  hasMathOperator
} from '../services/feeCalculator';
import { parseAmount } from '../services/cardCostEstimator';
import { StorageService } from '../services/storageService';
import { orderConverterCurrencies } from '../services/converterOrder';

interface ConverterTabProps {
  /** Opens the camera price scanner */
  onOpenScanner?: () => void;
  baseCurrency: string;
  onSelectBaseCurrency: (code: string) => void;
  baseAmount: string;
  onAmountChange: (amount: string) => void;
  pinnedCurrencies: string[];
  onRemovePinnedCurrency: (code: string) => void;
  favoriteCurrencies: string[];
  onToggleFavorite: (code: string) => void;
  onOpenAddModal: () => void;
  onOpenSelectBaseModal: () => void;
  onOpenSourceModal: () => void;
  rateData: ExchangeRateData | null;
  bankFeePct: number;
  onBankFeeChange: (fee: number) => void;
  onNavigateToFeeCalc: () => void;
  onNavigateToTrends: (from: string, to: string) => void;
  lastUpdatedTime: Date | null;
}

function copyFallback(text: string): void {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } catch {}
  document.body.removeChild(ta);
}

export const ConverterTab: React.FC<ConverterTabProps> = ({
  onOpenScanner,
  baseCurrency,
  onSelectBaseCurrency,
  baseAmount,
  onAmountChange,
  pinnedCurrencies,
  onRemovePinnedCurrency,
  favoriteCurrencies,
  onToggleFavorite,
  onOpenAddModal,
  onOpenSelectBaseModal,
  rateData,
  bankFeePct,
  onBankFeeChange,
  onNavigateToFeeCalc,
  onNavigateToTrends,
  lastUpdatedTime
}) => {
  const { t, lang, locale, pct, currency } = useT();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showFeeBar, setShowFeeBar] = useState<boolean>(false);

  const baseMeta = currency(baseCurrency);
  const evaluated = evaluateMathExpression(baseAmount, lang);
  const isExpr = hasMathOperator(baseAmount);
  const parsedFallback = parseAmount(baseAmount, lang);
  const numericAmount = evaluated !== null
    ? evaluated
    : (Number.isFinite(parsedFallback) ? parsedFallback : 0);

  // Sort pinned currencies: Favorites first, then Alphabetical A-Z
  const sortedCurrencies = useMemo(
    () => orderConverterCurrencies(pinnedCurrencies, favoriteCurrencies, baseCurrency),
    [pinnedCurrencies, baseCurrency, favoriteCurrencies]
  );

  // Copies a plain number (e.g. 1234.56) so it pastes cleanly into other apps
  const handleCopyAmount = (code: string, plainAmount: string) => {
    StorageService.triggerHaptic();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(plainAmount).catch(() => copyFallback(plainAmount));
    } else {
      copyFallback(plainAmount);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const appendOperator = (op: string) => {
    StorageService.triggerHaptic();
    const trimmed = baseAmount.trim();
    if (!trimmed) return;
    const withoutTrailingOp = trimmed.replace(/[+\-−–*×/÷\s]+$/, '');
    if (!withoutTrailingOp) return;
    onAmountChange(`${withoutTrailingOp} ${op} `);
  };

  const applyEvaluated = () => {
    if (!isExpr || evaluated === null || !Number.isFinite(evaluated)) return;
    StorageService.triggerHaptic();
    const rounded = Math.round(evaluated * 1e6) / 1e6;
    const text = lang === 'en' ? String(rounded) : String(rounded).replace('.', ',');
    onAmountChange(text);
  };

  const formattedRateDate = useMemo(() => {
    if (!rateData?.date || !/^\d{4}-\d{2}-\d{2}$/.test(rateData.date)) return null;
    const d = new Date(rateData.date + 'T12:00:00');
    return isNaN(d.getTime()) ? null : d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  }, [rateData?.date, locale]);

  return (
    <div className="space-y-4 w-full pb-8">
      {/* Diia-Inspired Currency Document Pass Card */}
      <div className="p-6 rounded-[24px] bg-card border border-line/[0.08] shadow-2xl relative overflow-hidden transition-all">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/[0.04] rounded-full blur-3xl pointer-events-none" />

        {/* Document Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-line/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent/[0.06] flex items-center justify-center text-accent">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-black tracking-wide text-ink uppercase">
              {t('conv.pass')} &bull; {baseMeta.code}
            </span>
          </div>

          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-inset text-ink2 border border-line/[0.08]">
            {formattedRateDate
              ? t('conv.rateDate', { date: formattedRateDate })
              : lastUpdatedTime
              ? lastUpdatedTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
              : t('conv.live')}
          </span>
        </div>

        {/* Currency & Fee Selectors */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {/* Default/Base Currency Switcher Button */}
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onOpenSelectBaseModal();
            }}
            className="flex items-center gap-3 px-4 py-2.5 min-w-0 rounded-[22px] bg-card hover:bg-inset2 active:scale-98 border border-line/[0.08] hover:border-accent/[0.18] text-ink transition-all shadow-sm group"
            title={t('conv.changeBaseTitle')}
          >
            <span className="text-2xl">{baseMeta.flag}</span>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-ink2 group-hover:text-accent transition-colors">{baseMeta.code}</span>
                <ChevronDown className="w-4 h-4 text-accent transition-transform group-hover:translate-y-0.5" />
              </div>
              <span className="text-[11px] text-muted font-medium block truncate max-w-[140px]">
                {baseMeta.country} &bull; {t('conv.tapToChange')}
              </span>
            </div>
          </button>

          {/* Fee Pill Toggle */}
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              setShowFeeBar(!showFeeBar);
            }}
            className={'flex items-center gap-1.5 px-3.5 py-2 shrink-0 whitespace-nowrap rounded-full text-xs font-extrabold transition-all border ' + (bankFeePct > 0 ? 'bg-inset text-ink border-line/[0.08]' : 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30')}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>{bankFeePct > 0 ? t('conv.feePill', { fee: pct(bankFeePct) }) : t('conv.noFee')}</span>
          </button>
        </div>

        {/* Number & Math Expression Input Display */}
        <div className="my-2">
          <div className="flex items-center justify-end gap-2 bg-card/90 border border-line/[0.08] rounded-[24px] px-4 py-3.5 focus-within:ring-2 focus-within:ring-accent/20 transition-all">
            {baseAmount !== '' && (
              <button
                type="button"
                onClick={() => {
                  StorageService.triggerHaptic();
                  onAmountChange('');
                }}
                aria-label={t('conv.clear')}
                title={t('conv.clear')}
                className="p-1.5 rounded-full text-muted hover:text-ink hover:bg-inset2 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <span className="text-accent font-black text-2xl select-none shrink-0">
              {baseMeta.symbol}
            </span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={baseAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isExpr && evaluated !== null) {
                  e.preventDefault();
                  applyEvaluated();
                }
              }}
              placeholder="0.00"
              className="w-full min-w-0 bg-transparent text-right font-mono font-black text-3xl sm:text-4xl text-ink placeholder-muted focus:outline-none tracking-tight"
            />
          </div>

          {/* Inline Math Operator Strip + Evaluated Preview */}
          <div className="mt-2 flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1">
              {['+', '−', '×', '÷'].map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => appendOperator(op)}
                  className="w-8 h-7 rounded-full bg-inset hover:bg-inset2 border border-line/[0.08] text-xs font-black text-ink2 active:scale-95 transition-all"
                >
                  {op}
                </button>
              ))}
              {isExpr && evaluated !== null && (
                <button
                  type="button"
                  onClick={applyEvaluated}
                  className="px-2.5 h-7 rounded-full bg-accent text-onaccent text-xs font-black active:scale-95 transition-all"
                >
                  = {formatCurrencyAmount(numericAmount, baseMeta.decimalPlaces, false, '', locale)}
                </button>
              )}
            </div>
            <span className="text-xs text-muted font-medium truncate">{baseMeta.name}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted font-medium mt-1.5 px-2">
            <span className="flex items-center gap-1 text-[11px] text-muted font-mono">
              <Clock className="w-3 h-3 text-accent" />
              {lastUpdatedTime ? t('conv.liveAt', { time: lastUpdatedTime.toLocaleTimeString(locale) }) : t('conv.connecting')}
            </span>
          </div>
        </div>

        {/* Bank Fee Quick Presets */}
        {showFeeBar && (
          <div className="mt-4 pt-4 border-t border-line/[0.08] animate-fade-in space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                {t('conv.surcharge')}
              </span>
              <button
                onClick={onNavigateToFeeCalc}
                className="text-xs font-bold text-accent hover:underline flex items-center gap-0.5"
              >
                <span>{t('conv.fullSimulator')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[0, 1.0, 2.0, 3.0].map((fee) => {
                const isSelected = Math.abs(bankFeePct - fee) < 0.05;
                return (
                  <button
                    key={fee}
                    onClick={() => {
                      StorageService.triggerHaptic();
                      onBankFeeChange(fee);
                    }}
                    className={'py-2.5 rounded-[18px] text-xs font-extrabold border transition-all ' + (isSelected ? 'bg-accent text-onaccent border-accent shadow-sm' : 'bg-card text-ink2 border-line/[0.08] hover:bg-inset2')}
                  >
                    {fee === 0 ? t('common.feeFree') : fee === 2.0 ? t('common.feeAvg') : pct(fee)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Watchlist Section Header */}
      <div className="flex items-center justify-between gap-2 px-2 pt-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-black uppercase tracking-wider text-ink2">
            {t('conv.conversions')}
          </span>
          <span className="shrink-0 whitespace-nowrap text-[11px] px-2.5 py-0.5 rounded-full bg-card font-bold text-accent border border-accent/[0.18]">
            {t('conv.activeCount', { n: sortedCurrencies.length })}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
        {onOpenScanner && (
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onOpenScanner();
            }}
            aria-label={t('conv.scan')}
            className="flex items-center gap-1.5 px-3 py-1.5 shrink-0 whitespace-nowrap rounded-full bg-card border border-line/[0.12] hover:bg-inset2 active:scale-95 text-ink text-xs font-black transition-all"
          >
            <ScanLine className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t('conv.scan')}</span>
          </button>
        )}
        <button
          onClick={() => {
            StorageService.triggerHaptic();
            onOpenAddModal();
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 shrink-0 whitespace-nowrap rounded-full bg-accent hover:bg-accent active:scale-95 text-onaccent text-xs font-black transition-all shadow-md shadow-black/10"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>{t('conv.addCurrency')}</span>
        </button>
        </div>
      </div>

      {/* Converted Currencies Diia Cards */}
      <div className="space-y-3">
        {sortedCurrencies.map((code) => {
          const meta = currency(code);
          const rawRate = rateData ? RateService.calculateRate(baseCurrency, code, rateData) : NaN;
          const isFavorite = favoriteCurrencies.includes(code);

          const feeCalc = rateData
            ? calculateBankFeeConversion(numericAmount, baseCurrency, code, rawRate, bankFeePct)
            : null;

          const formattedTotal = feeCalc
            ? formatCurrencyAmount(feeCalc.totalBilledAmount, meta.decimalPlaces, false, '', locale)
            : '—';
          const plainTotal = feeCalc
            ? formatCurrencyAmount(feeCalc.totalBilledAmount, meta.decimalPlaces).replace(/,/g, '')
            : '';
          const formattedFee = feeCalc
            ? formatCurrencyAmount(feeCalc.bankFeeAmount, meta.decimalPlaces, false, '', locale)
            : '—';
          const isCopied = copiedCode === code;

          return (
            <div
              key={code}
              className={'p-5 rounded-[24px] bg-card border transition-all relative overflow-hidden ' + (isFavorite ? 'border-line/[0.08]' : 'border-line/[0.08] hover:border-line/[0.08] shadow-sm')}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div
                  className="flex items-center gap-3.5 cursor-pointer group"
                  onClick={() => {
                    StorageService.triggerHaptic();
                    onSelectBaseCurrency(code);
                  }}
                  title={t('conv.setBaseTitle', { code })}
                >
                  <div className="w-12 h-12 rounded-[20px] bg-card border border-line/[0.08] group-hover:border-accent/[0.18] flex items-center justify-center text-2xl shadow-inner transition-colors">
                    {meta.flag}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-lg text-ink group-hover:text-accent tracking-tight transition-colors">{meta.code}</span>
                      <span className="text-xs text-accent font-mono font-bold">({meta.symbol})</span>
                      {isFavorite && (
                        <Star className="w-3.5 h-3.5 fill-accent text-accent ml-0.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted font-medium group-hover:text-ink2 transition-colors">
                      {meta.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Make Base Currency Quick Action Button */}
                  <button
                    onClick={() => {
                      StorageService.triggerHaptic();
                      onSelectBaseCurrency(code);
                    }}
                    className="p-2 rounded-full text-muted hover:text-accent hover:bg-accent/[0.04] transition-colors"
                    title={t('conv.setBaseTitle', { code })}
                    aria-label={t('conv.setBaseTitle', { code })}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      StorageService.triggerHaptic();
                      onToggleFavorite(code);
                    }}
                    className={'p-2 rounded-full transition-colors ' + (isFavorite ? 'text-accent hover:bg-accent/[0.06]' : 'text-muted/70 hover:text-accent hover:bg-accent/[0.04]')}
                    title={isFavorite ? t('common.removeFav') : t('common.addFav')}
                    aria-label={isFavorite ? t('common.removeFav') : t('common.addFav')}
                  >
                    <Star className={'w-4 h-4 ' + (isFavorite ? 'fill-accent' : '')} />
                  </button>

                  <button
                    onClick={() => {
                      StorageService.triggerHaptic();
                      onRemovePinnedCurrency(code);
                    }}
                    className="p-2 rounded-full text-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                    title={t('conv.remove')}
                    aria-label={t('conv.remove')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Amount display */}
              <div className="my-3 text-right">
                {!rateData ? (
                  <div className="flex flex-col items-end gap-2 py-1" aria-hidden="true">
                    <div className="h-8 w-36 rounded-xl bg-inset animate-pulse" />
                    {bankFeePct > 0 && <div className="h-3.5 w-44 rounded-lg bg-inset animate-pulse" />}
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-end gap-1.5">
                      <span className="font-mono font-black text-3xl text-ink tracking-tight">
                        {formattedTotal}
                      </span>
                      <span className="text-base font-extrabold text-accent">
                        {meta.symbol}
                      </span>
                    </div>

                    {bankFeePct > 0 && isFinite(rawRate) && (
                      <p className="text-xs font-bold text-accent mt-1">
                        {t('conv.includesFee', { fee: formattedFee, symbol: meta.symbol, pct: pct(bankFeePct) })}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Footer: Live Rate + Action Buttons */}
              <div className="pt-3.5 border-t border-line/[0.08] flex items-center justify-between text-xs">
                {!rateData ? (
                  <div className="h-3.5 w-32 rounded bg-inset animate-pulse" aria-hidden="true" />
                ) : (
                  <span className="font-mono text-muted text-[11px]">
                    1 {baseMeta.code} = {formatRate(rawRate, locale)} {meta.code}
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyAmount(code, plainTotal)}
                    disabled={!rateData || !isFinite(rawRate)}
                    className={'flex items-center gap-1 px-3 py-1.5 rounded-[14px] font-bold text-xs transition-all disabled:opacity-40 ' + (isCopied ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' : 'bg-card hover:bg-inset2 text-ink2 border border-line/[0.08]')}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t('conv.copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t('conv.copy')}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      StorageService.triggerHaptic();
                      onNavigateToTrends(baseCurrency, code);
                    }}
                    className="p-2 rounded-[14px] bg-card hover:bg-inset2 text-ink2 border border-line/[0.08] transition-colors"
                    title={t('conv.trendTitle')}
                    aria-label={t('conv.trendTitle')}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-accent" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
