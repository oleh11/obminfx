import React from 'react';
import { StorageService } from '../services/storageService';
import { RefreshCw, Globe, Settings, WifiOff } from 'lucide-react';
import { RateSourceId } from '../types/currency';
import { AVAILABLE_SOURCES } from '../data/currencies';

interface NavbarProps {
  activeSourceId: RateSourceId;
  onOpenSourceModal: () => void;
  onOpenSettingsModal: () => void;
  onRefreshRates: () => void;
  isRefreshing: boolean;
  isOnline: boolean;
  lastUpdatedTime: Date | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSourceId,
  onOpenSourceModal,
  onOpenSettingsModal,
  onRefreshRates,
  isRefreshing,
  isOnline,
  lastUpdatedTime
}) => {
  const currentSource = AVAILABLE_SOURCES.find(s => s.id === activeSourceId) || AVAILABLE_SOURCES[0];

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Updating...';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b0e14]/95 backdrop-blur-xl border-b border-white/10 px-4 pb-2.5 safe-area-pt transition-colors">
      <div className="w-full max-w-2xl mx-auto flex items-center justify-between">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-[18px] bg-[#161a24] border border-white/15 flex items-center justify-center shadow-inner text-white font-black text-xl">
            <span className="text-[#D4FF00] font-mono">₴</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black tracking-tight text-white">Obmin<span className="text-[#D4FF00]">FX</span></h1>
              <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/25">
                Live FX
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentSource.shortName} &bull; {formatLastUpdated(lastUpdatedTime)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onOpenSourceModal();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#161a24] hover:bg-[#202634] active:scale-95 text-slate-200 border border-white/10 text-xs font-bold transition-all shadow-sm"
            title="Exchange Rate Sources"
          >
            <Globe className="w-3.5 h-3.5 text-[#D4FF00]" />
            <span>Sources</span>
          </button>

          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onRefreshRates();
            }}
            disabled={isRefreshing}
            className="p-2 rounded-full bg-[#161a24] hover:bg-[#202634] active:scale-95 text-slate-300 transition-all disabled:opacity-50 border border-white/10"
            title="Refresh Rates"
          >
            <RefreshCw className={'w-3.5 h-3.5 ' + (isRefreshing ? 'animate-spin text-[#D4FF00]' : '')} />
          </button>

          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onOpenSettingsModal();
            }}
            className="p-2 rounded-full bg-[#161a24] hover:bg-[#202634] active:scale-95 text-slate-300 transition-all border border-white/10"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
      </div>

      {!isOnline && (
        <div className="mt-2 py-1 px-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center gap-1.5 text-xs text-amber-300 font-medium animate-pulse">
          <WifiOff className="w-3.5 h-3.5" /> Offline Mode: Using saved exchange rates
        </div>
      )}
    </header>
  );
};
