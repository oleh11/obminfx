import React from 'react';
import { StorageService } from '../services/storageService';
import { Percent, ShieldAlert, Info, X, ArrowRightLeft } from 'lucide-react';
import { getCurrencyMeta } from '../data/currencies';

interface SettingsModalProps {
  isOpen: boolean;
  baseCurrency: string;
  onSelectBaseCurrency: (code: string) => void;
  bankFeePct: number;
  onBankFeeChange: (fee: number) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onClose: () => void;
  onResetDefaults: () => void;
  onOpenSelectBaseModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  baseCurrency,
  onSelectBaseCurrency,
  bankFeePct,
  onBankFeeChange,
  theme,
  onToggleTheme,
  onClose,
  onResetDefaults,
  onOpenSelectBaseModal
}) => {
  if (!isOpen) return null;

  const baseMeta = getCurrencyMeta(baseCurrency);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">App Settings</h2>
            <p className="text-xs text-slate-400">Configure ObminFX preferences & defaults</p>
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

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Default Base Currency Configuration */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-[#D4FF00]" />
                Default Base Currency
              </h3>
              <button
                onClick={() => {
                  StorageService.triggerHaptic();
                  onClose();
                  onOpenSelectBaseModal?.();
                }}
                className="text-xs font-bold text-[#D4FF00] hover:underline"
              >
                Change
              </button>
            </div>
            <div 
              onClick={() => {
                StorageService.triggerHaptic();
                onClose();
                onOpenSelectBaseModal?.();
              }}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-[#D4FF00]/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{baseMeta.flag}</span>
                <div>
                  <span className="font-extrabold text-sm text-white">{baseMeta.code}</span>
                  <span className="text-xs text-slate-400 ml-1.5">{baseMeta.name}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#D4FF00]">
                {baseMeta.symbol}
              </span>
            </div>
          </div>

          {/* Bank Fee Configuration */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-amber-400" />
                Default Bank Fee
              </h3>
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-lg">
                {bankFeePct.toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[0, 1.0, 2.0, 3.0].map((fee) => (
                <button
                  key={fee}
                  onClick={() => {
                    StorageService.triggerHaptic();
                    onBankFeeChange(fee);
                  }}
                  className={'py-2 rounded-xl text-xs font-extrabold border transition-all ' + (Math.abs(bankFeePct - fee) < 0.05 ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md ring-1 ring-amber-500/40' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700')}
                >
                  {fee === 0 ? '0% Free' : fee === 2.0 ? '2% Avg' : fee + '%'}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Defaults */}
          <div className="p-4 rounded-2xl border border-red-900/30 bg-red-950/20">
            <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" /> Reset Watchlist
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Restore default pinned currencies (USD, EUR, UAH, GBP, PLN, etc.) and clear cached rates.
            </p>
            <button
              onClick={() => {
                StorageService.triggerHaptic();
                onResetDefaults();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-98 text-white font-bold text-xs transition-all shadow-md shadow-red-600/20"
            >
              Reset to Defaults
            </button>
          </div>

          {/* About ObminFX */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
            <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400" /> About ObminFX
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-2">
              <strong>ObminFX</strong> (from Ukrainian <em>Обмін</em> • Exchange) is a modern Android currency converter & bank fee calculator built with Material Design 3 guidelines.
            </p>
            <p className="text-[11px] text-slate-400">
              Supports live European Central Bank (ECB) benchmarks, National Bank of Ukraine (NBU) rates, Mastercard & Visa FX settlement spreads, and custom bank fee calculations.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onClose();
            }}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-white font-bold text-xs transition-all shadow-md shadow-amber-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
