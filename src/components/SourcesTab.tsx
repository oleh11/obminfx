import React, { useState } from 'react';
import { 
  Globe, ShieldCheck, CreditCard, Sparkles, Building2, 
  Check, RefreshCw, Layers, Sliders, ExternalLink, ArrowRightLeft, Info 
} from 'lucide-react';
import { RateSourceId, RateSource, ExchangeRateData } from '../types/currency';
import { AVAILABLE_SOURCES, ALL_CURRENCIES, getCurrencyMeta } from '../data/currencies';
import { RateService } from '../services/rateService';
import { StorageService } from '../services/storageService';
import { formatCurrencyAmount } from '../services/feeCalculator';

interface SourcesTabProps {
  activeSourceId: RateSourceId;
  onSelectSource: (sourceId: RateSourceId) => void;
  baseCurrency: string;
  targetCurrency: string;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  rateData: ExchangeRateData | null;
}

export const SourcesTab: React.FC<SourcesTabProps> = ({
  activeSourceId,
  onSelectSource,
  baseCurrency,
  targetCurrency,
  onRefreshAll,
  isRefreshing,
  rateData
}) => {
  const [customSpread, setCustomSpread] = useState<string>(
    localStorage.getItem('custom_bank_spread_pct') || '1.5'
  );
  const [compareBase, setCompareBase] = useState<string>(baseCurrency || 'USD');
  const [compareTarget, setCompareTarget] = useState<string>(targetCurrency || 'UAH');

  const handleCustomSpreadChange = (val: string) => {
    setCustomSpread(val);
    localStorage.setItem('custom_bank_spread_pct', val);
  };

  const getSourceIcon = (id: RateSourceId) => {
    switch (id) {
      case 'ecb':
        return <ShieldCheck className="w-5 h-5 text-[#E2F163]" />;
      case 'nbu':
        return <Globe className="w-5 h-5 text-[#E2F163]" />;
      case 'mastercard':
        return <CreditCard className="w-5 h-5 text-yellow-400" />;
      case 'currencylayer':
        return <Layers className="w-5 h-5 text-[#E2F163]" />;
      case 'custom_bank':
        return <Building2 className="w-5 h-5 text-[#E2F163]" />;
      default:
        return <Globe className="w-5 h-5 text-[#E2F163]" />;
    }
  };

  const baseMeta = getCurrencyMeta(compareBase);
  const targetMeta = getCurrencyMeta(compareTarget);

  return (
    <div className="space-y-4 w-full pb-8">
      {/* Header Banner - Warm Charcoal & Gold */}
      <div className="p-5 rounded-[28px] bg-[#161a26] border border-white/5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[20px] bg-[#E2F163]/15 border border-[#E2F163]/25 flex items-center justify-center text-[#E2F163]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-tight">
              Exchange Rate Sources
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              ECB, NBU, Mastercard FX & Global Open Market rates
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            StorageService.triggerHaptic();
            onRefreshAll();
          }}
          disabled={isRefreshing}
          className="p-2.5 rounded-full bg-[#0e111a] hover:bg-[#1a1f2e] text-slate-300 border border-white/5 transition-all disabled:opacity-50"
          title="Refresh all source rates"
        >
          <RefreshCw className={'w-4 h-4 ' + (isRefreshing ? 'animate-spin text-[#E2F163]' : '')} />
        </button>
      </div>

      {/* Live Provider Comparison Bento Box */}
      <div className="p-5 rounded-[32px] bg-[#161a26] border border-white/5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#E2F163]" />
            Live Provider Comparison
          </h3>
          <span className="text-[11px] text-[#E2F163] font-mono font-bold">1 {compareBase} &rarr; {compareTarget}</span>
        </div>

        {/* Currency selectors */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <select
            value={compareBase}
            onChange={(e) => setCompareBase(e.target.value)}
            className="bg-[#0e111a] border border-white/5 rounded-[18px] px-3 py-2.5 font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#E2F163]/40"
          >
            {[...ALL_CURRENCIES].sort((a, b) => a.code.localeCompare(b.code)).map((c) => (
              <option key={'src-base-' + c.code} value={c.code}>
                {c.flag} {c.code} ({c.name})
              </option>
            ))}
          </select>
          <select
            value={compareTarget}
            onChange={(e) => setCompareTarget(e.target.value)}
            className="bg-[#0e111a] border border-white/5 rounded-[18px] px-3 py-2.5 font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#E2F163]/40"
          >
            {[...ALL_CURRENCIES].sort((a, b) => a.code.localeCompare(b.code)).map((c) => (
              <option key={'src-target-' + c.code} value={c.code}>
                {c.flag} {c.code} ({c.name})
              </option>
            ))}
          </select>
        </div>

        {/* Comparison List */}
        <div className="divide-y divide-white/5 border border-white/5 rounded-[22px] overflow-hidden bg-[#0e111a]/80">
          {AVAILABLE_SOURCES.map((source) => {
            const isSelected = source.id === activeSourceId;
            let rate = 1.0;
            if (rateData) {
              rate = RateService.calculateRate(compareBase, compareTarget, rateData);
              if (source.id === 'mastercard') {
                rate = rate * 1.0022;
              } else if (source.id === 'custom_bank') {
                const spread = parseFloat(customSpread) || 1.5;
                rate = rate * (1 + spread / 100);
              }
            }

            return (
              <div
                key={source.id}
                onClick={() => {
                  StorageService.triggerHaptic();
                  onSelectSource(source.id);
                }}
                className={'p-3.5 flex items-center justify-between cursor-pointer transition-all ' + (isSelected ? 'bg-[#E2F163]/15 border-l-4 border-l-amber-500' : 'hover:bg-[#1a1f2e]')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-[14px] bg-[#161a26] border border-white/5">
                    {getSourceIcon(source.id)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-white">{source.shortName}</span>
                      {isSelected && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E2F163] text-slate-950 font-black uppercase">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{source.badge}</span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-black text-sm text-white">
                    {rate < 0.01 ? rate.toFixed(6) : rate.toFixed(4)} {targetMeta.symbol}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {source.updateFrequency}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provider Details Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 px-1">
          Available Rate Benchmarks
        </h3>

        {AVAILABLE_SOURCES.map((source) => {
          const isSelected = source.id === activeSourceId;
          return (
            <div
              key={'card-' + source.id}
              className={'p-5 rounded-[28px] border transition-all ' + (isSelected ? 'bg-[#161a26] border-[#E2F163]/50 shadow-xl ring-1 ring-[#E2F163]/25' : 'bg-[#141722] border-white/5 hover:border-slate-700')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-[18px] bg-[#0e111a] border border-white/5 flex-shrink-0">
                    {getSourceIcon(source.id)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-white text-sm">{source.name}</h4>
                      {source.isOfficial && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#E2F163]/15 text-[#E2F163] border border-[#E2F163]/30">
                          Official
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{source.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    StorageService.triggerHaptic();
                    onSelectSource(source.id);
                  }}
                  className={'px-4 py-1.5 rounded-full text-xs font-black transition-all shrink-0 active:scale-95 ' + (isSelected ? 'bg-[#E2F163] text-slate-950 shadow-md shadow-[#E2F163]/20' : 'bg-[#1e2333] text-slate-300 hover:bg-[#2a3147] border border-white/5')}
                >
                  {isSelected ? 'Active' : 'Select'}
                </button>
              </div>

              {source.id === 'custom_bank' && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">Your Bank FX Spread Markup:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      value={customSpread}
                      onChange={(e) => handleCustomSpreadChange(e.target.value)}
                      className="w-16 bg-[#0e111a] border border-white/10 rounded-lg px-2 py-1 text-center font-mono font-black text-white focus:outline-none focus:ring-1 focus:ring-[#E2F163]"
                    />
                    <span className="font-bold text-[#E2F163]">%</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
