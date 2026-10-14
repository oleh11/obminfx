import React from 'react';
import { Globe, Check, Info, ShieldCheck, Zap, X, CreditCard, Sparkles, Building2 } from 'lucide-react';
import { RateSourceId, RateSource, ExchangeRateData } from '../types/currency';
import { AVAILABLE_SOURCES } from '../data/currencies';
import { StorageService } from '../services/storageService';
import { RateService } from '../services/rateService';

interface SourceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSourceId: RateSourceId;
  onSelectSource: (sourceId: RateSourceId) => void;
  baseCurrency: string;
  targetCurrency: string;
  activeRateData: ExchangeRateData | null;
}

export const SourceSelectorModal: React.FC<SourceSelectorModalProps> = ({
  isOpen,
  onClose,
  activeSourceId,
  onSelectSource,
  baseCurrency,
  targetCurrency,
  activeRateData
}) => {
  if (!isOpen) return null;

  const getSourceIcon = (id: RateSourceId) => {
    switch (id) {
      case 'ecb':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'open_market':
        return <Globe className="w-5 h-5 text-indigo-400" />;
      case 'mastercard':
        return <CreditCard className="w-5 h-5 text-amber-400" />;
      case 'visa':
        return <CreditCard className="w-5 h-5 text-blue-400" />;
      case 'nbu':
        return <Globe className="w-5 h-5 text-emerald-400" />;
      case 'crypto_metals':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'custom_bank':
        return <Building2 className="w-5 h-5 text-cyan-400" />;
      default:
        return <Globe className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Select Exchange Rate Source</h2>
              <p className="text-xs text-slate-400">Choose your live data provider or card benchmark</p>
            </div>
          </div>
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onClose();
            }}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {AVAILABLE_SOURCES.map((source: RateSource) => {
            const isSelected = source.id === activeSourceId;
            return (
              <div
                key={source.id}
                onClick={() => {
                  StorageService.triggerHaptic();
                  onSelectSource(source.id);
                  onClose();
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-xl bg-slate-900 border border-slate-700/60">
                      {getSourceIcon(source.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm">{source.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          source.isOfficial
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-700 text-slate-300 border-slate-600'
                        }`}>
                          {source.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {source.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          {source.updateFrequency}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 transition-all ${
                    isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-600'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Educational Note */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span className="font-semibold block mb-0.5">Why Exchange Rates Differ Between Sources:</span>
              Central banks (like ECB) publish daily wholesale reference rates. Card payment networks (Mastercard/Visa) apply wholesale processing spreads. When making card purchases abroad, your bank adds its specific processing fee on top of the network rate.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
