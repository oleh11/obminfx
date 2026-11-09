import React, { useState, useMemo } from 'react';
import { 
  ArrowRightLeft, Plus, Trash2, Check, Copy, 
  TrendingUp, Percent, Star, Sparkles, ChevronRight, ChevronDown, Clock, ShieldCheck 
} from 'lucide-react';
import { ExchangeRateData } from '../types/currency';
import { useT } from '../i18n';
import { RateService } from '../services/rateService';
import { formatCurrencyAmount, calculateBankFeeConversion, formatRate } from '../services/feeCalculator';
import { StorageService } from '../services/storageService';

interface ConverterTabProps {
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

export const ConverterTab: React.FC<ConverterTabProps> = ({
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
  onOpenSourceModal,
  rateData,
  bankFeePct,
  onBankFeeChange,
  onNavigateToFeeCalc,
  onNavigateToTrends,
  lastUpdatedTime
}) => {
  const { t, locale, pct, currency } = useT();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showFeeBar, setShowFeeBar] = useState<boolean>(false);

  const baseMeta = currency(baseCurrency);
  const numericAmount = parseFloat(baseAmount) || 0;

  // Sort pinned currencies: Favorites first, then Alphabetical A-Z
  const sortedCurrencies = useMemo(() => {
    const list = pinnedCurrencies.filter(c => c !== baseCurrency);
    return list.sort((a, b) => {
      const aFav = favoriteCurrencies.includes(a);
      const bFav = favoriteCurrencies.includes(b);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.localeCompare(b);
    });
  }, [pinnedCurrencies, baseCurrency, favoriteCurrencies]);

  // Copies a plain number (e.g. 1234.56) so it pastes cleanly into other apps
  const handleCopyAmount = (code: string, plainAmount: string) => {
    StorageService.triggerHaptic();
    navigator.clipboard.writeText(plainAmount);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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
            {lastUpdatedTime ? lastUpdatedTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : t('conv.live')}
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

        {/* Number Input Display */}
        <div className="my-2">
          <div className="flex items-baseline justify-end gap-2 bg-card/90 border border-line/[0.08] rounded-[24px] px-5 py-4 focus-within:ring-2 focus-within:ring-accent/20 transition-all">
            <span className="text-accent font-black text-2xl select-none">
              {baseMeta.symbol}
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={baseAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-right font-mono font-black text-4xl text-ink placeholder-muted focus:outline-none tracking-tight"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted font-medium mt-2 px-2">
            <span className="flex items-center gap-1 text-[11px] text-muted font-mono">
              <Clock className="w-3 h-3 text-accent" />
              {lastUpdatedTime ? t('conv.liveAt', { time: lastUpdatedTime.toLocaleTimeString(locale) }) : t('conv.connecting')}
            </span>
            <span>{baseMeta.name}</span>
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

      {/* Converted Currencies Diia Cards */}
      <div className="space-y-3">
        {sortedCurrencies.map((code) => {
          const meta = currency(code);
          const rawRate = rateData ? RateService.calculateRate(baseCurrency, code, rateData) : 1.0;
          const isFavorite = favoriteCurrencies.includes(code);

          const feeCalc = calculateBankFeeConversion(
            numericAmount,
            baseCurrency,
            code,
            rawRate,
            bankFeePct
          );

          const formattedTotal = formatCurrencyAmount(feeCalc.totalBilledAmount, meta.decimalPlaces, false, '', locale);
          const plainTotal = formatCurrencyAmount(feeCalc.totalBilledAmount, meta.decimalPlaces).replace(/,/g, '');
          const formattedFee = formatCurrencyAmount(feeCalc.bankFeeAmount, meta.decimalPlaces, false, '', locale);
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
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Amount display */}
              <div className="my-3 text-right">
                <div className="flex items-baseline justify-end gap-1.5">
                  <span className="font-mono font-black text-3xl text-ink tracking-tight">
                    {formattedTotal}
                  </span>
                  <span className="text-base font-extrabold text-accent">
                    {meta.symbol}
                  </span>
                </div>

                {bankFeePct > 0 && (
                  <p className="text-xs font-bold text-accent mt-1">
                    {t('conv.includesFee', { fee: formattedFee, symbol: meta.symbol, pct: pct(bankFeePct) })}
                  </p>
                )}
              </div>

              {/* Footer: Live Rate + Action Buttons */}
              <div className="pt-3.5 border-t border-line/[0.08] flex items-center justify-between text-xs">
                <span className="font-mono text-muted text-[11px]">
                  1 {baseMeta.code} = {formatRate(rawRate, locale)} {meta.code}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyAmount(code, plainTotal)}
                    className={'flex items-center gap-1 px-3 py-1.5 rounded-[14px] font-bold text-xs transition-all ' + (isCopied ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' : 'bg-card hover:bg-inset2 text-ink2 border border-line/[0.08]')}
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
