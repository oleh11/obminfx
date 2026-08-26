const fs = require('fs');

const converterTab = `import React, { useState, useMemo } from 'react';
import { 
  ArrowRightLeft, Plus, Trash2, Check, Copy, 
  TrendingUp, Percent, Star, Sparkles, ChevronRight, Clock 
} from 'lucide-react';
import { ExchangeRateData } from '../types/currency';
import { getCurrencyMeta } from '../data/currencies';
import { RateService } from '../services/rateService';
import { formatCurrencyAmount, calculateBankFeeConversion } from '../services/feeCalculator';
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
  onOpenSourceModal,
  rateData,
  bankFeePct,
  onBankFeeChange,
  onNavigateToFeeCalc,
  onNavigateToTrends,
  lastUpdatedTime
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showFeeBar, setShowFeeBar] = useState<boolean>(false);

  const baseMeta = getCurrencyMeta(baseCurrency);
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

  const handleCopyAmount = (code: string, formattedAmount: string) => {
    StorageService.triggerHaptic();
    navigator.clipboard.writeText(formattedAmount.replace(/,/g, ''));
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-4 max-w-md mx-auto pb-8">
      {/* Hero Bento Box */}
      <div className="p-6 rounded-[32px] bg-[#161a26] border border-white/5 shadow-2xl relative overflow-hidden transition-all">
        {/* Ambient Warm Glow */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Controls: Currency Pill & Fee Pill */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onOpenAddModal();
            }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-[22px] bg-[#0f121a] hover:bg-[#1a1f2e] active:scale-98 border border-white/5 text-white transition-all shadow-sm"
          >
            <span className="text-2xl">{baseMeta.flag}</span>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-slate-100">{baseMeta.code}</span>
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-[11px] text-slate-400 font-medium block truncate max-w-[130px]">
                {baseMeta.country}
              </span>
            </div>
          </button>

          {/* Bank Fee Pill Toggle */}
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              setShowFeeBar(!showFeeBar);
            }}
            className={'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold transition-all border ' + (bankFeePct > 0 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-sm' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30')}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>{bankFeePct > 0 ? \`\${bankFeePct}% Fee\` : '0% No Fee'}</span>
          </button>
        </div>

        {/* Hero Number Display Input */}
        <div className="my-2">
          <div className="flex items-baseline justify-end gap-2 bg-[#0a0d14]/90 border border-white/5 rounded-[24px] px-5 py-4 focus-within:ring-2 focus-within:ring-amber-500/50 transition-all">
            <span className="text-amber-400/80 font-black text-2xl select-none">
              {baseMeta.symbol}
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={baseAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-right font-mono font-black text-4xl text-white placeholder-slate-600 focus:outline-none tracking-tight"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mt-2 px-2">
            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <Clock className="w-3 h-3 text-amber-400" />
              {lastUpdatedTime ? \`Live: \${lastUpdatedTime.toLocaleTimeString()}\` : 'Connecting...'}
            </span>
            <span>{baseMeta.name}</span>
          </div>
        </div>

        {/* Bank Fee Quick Preset Pills */}
        {showFeeBar && (
          <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Bank Processing Surcharge
              </span>
              <button
                onClick={onNavigateToFeeCalc}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
              >
                <span>Full Simulator</span>
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
                    className={'py-2.5 rounded-[18px] text-xs font-extrabold border transition-all ' + (isSelected ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' : 'bg-[#0f121a] text-slate-300 border-white/5 hover:bg-[#1a1f2e]')}
                  >
                    {fee === 0 ? '0% Free' : fee === 2.0 ? '2% Avg' : \`\${fee}%\`}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Watchlist Section Header */}
      <div className="flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
            Conversions (A-Z with ⭐ Top)
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#161a26] font-bold text-amber-300 border border-amber-500/20">
            {sortedCurrencies.length} active
          </span>
        </div>

        <button
          onClick={() => {
            StorageService.triggerHaptic();
            onOpenAddModal();
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-500/20"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Add Currency</span>
        </button>
      </div>

      {/* Converted Currencies Bento Cards */}
      <div className="space-y-3">
        {sortedCurrencies.map((code) => {
          const meta = getCurrencyMeta(code);
          const rawRate = rateData ? RateService.calculateRate(baseCurrency, code, rateData) : 1.0;
          const isFavorite = favoriteCurrencies.includes(code);

          const feeCalc = calculateBankFeeConversion(
            numericAmount,
            baseCurrency,
            code,
            rawRate,
            bankFeePct
          );

          const formattedTotal = formatCurrencyAmount(feeCalc.totalBilledAmount, meta.decimalPlaces);
          const formattedFee = formatCurrencyAmount(feeCalc.bankFeeAmount, meta.decimalPlaces);
          const isCopied = copiedCode === code;

          return (
            <div
              key={code}
              className={'p-5 rounded-[28px] bg-[#161a26] border transition-all relative overflow-hidden ' + (isFavorite ? 'border-amber-500/30 ring-1 ring-amber-500/20 shadow-xl' : 'border-white/5 hover:border-slate-700 shadow-lg')}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-[20px] bg-[#0e111a] border border-white/5 flex items-center justify-center text-2xl shadow-inner">
                    {meta.flag}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-lg text-white tracking-tight">{meta.code}</span>
                      <span className="text-xs text-amber-400 font-mono font-bold">({meta.symbol})</span>
                      {isFavorite && (
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 ml-0.5" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{meta.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      StorageService.triggerHaptic();
                      onToggleFavorite(code);
                    }}
                    className={'p-2 rounded-full transition-colors ' + (isFavorite ? 'text-amber-400 hover:bg-amber-500/15' : 'text-slate-600 hover:text-amber-400 hover:bg-amber-500/10')}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={'w-4 h-4 ' + (isFavorite ? 'fill-amber-400' : '')} />
                  </button>

                  <button
                    onClick={() => {
                      StorageService.triggerHaptic();
                      onRemovePinnedCurrency(code);
                    }}
                    className="p-2 rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove from list"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Amount display */}
              <div className="my-3 text-right">
                <div className="flex items-baseline justify-end gap-1.5">
                  <span className="font-mono font-black text-3xl text-white tracking-tight">
                    {formattedTotal}
                  </span>
                  <span className="text-base font-extrabold text-amber-400">
                    {meta.symbol}
                  </span>
                </div>

                {bankFeePct > 0 && (
                  <p className="text-xs font-bold text-amber-300 mt-1">
                    Includes +{formattedFee} {meta.symbol} ({bankFeePct}%) bank fee
                  </p>
                )}
              </div>

              {/* Footer: Live Rate + Action Buttons */}
              <div className="pt-3.5 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400 text-[11px]">
                  1 {baseMeta.code} = {rawRate < 0.01 ? rawRate.toFixed(6) : rawRate.toFixed(4)} {meta.code}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyAmount(code, formattedTotal)}
                    className={'flex items-center gap-1 px-3 py-1.5 rounded-[14px] font-bold text-xs transition-all ' + (isCopied ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-[#0f121a] hover:bg-[#1a1f2e] text-slate-300 border border-white/5')}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      StorageService.triggerHaptic();
                      onNavigateToTrends(baseCurrency, code);
                    }}
                    className="p-2 rounded-[14px] bg-[#0f121a] hover:bg-[#1a1f2e] text-slate-300 border border-white/5 transition-colors"
                    title="View historical trend chart"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
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
`;

fs.writeFileSync('src/components/ConverterTab.tsx', converterTab, 'utf8');
console.log('ConverterTab.tsx updated with favorites & timestamp');
