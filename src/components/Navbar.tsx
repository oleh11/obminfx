import React from 'react';
import { StorageService } from '../services/storageService';
import { RefreshCw, Globe, Settings, WifiOff } from 'lucide-react';
import { RateSourceId } from '../types/currency';
import { useT } from '../i18n';

interface NavbarProps {
  activeSourceId: RateSourceId;
  onOpenSourceModal: () => void;
  onOpenSettingsModal: () => void;
  onRefreshRates: () => void;
  isRefreshing: boolean;
  isOnline: boolean;
  lastUpdatedTime: Date | null;
  isFallback?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSourceId,
  onOpenSourceModal,
  onOpenSettingsModal,
  onRefreshRates,
  isRefreshing,
  isOnline,
  lastUpdatedTime,
  isFallback = false
}) => {
  const { t, locale, source } = useT();
  const currentSource = source(activeSourceId);

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return t('nav.updating');
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-line/[0.08] px-4 pb-2.5 safe-area-pt transition-colors">
      <div className="w-full max-w-2xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-[18px] bg-card border border-line/[0.08] flex items-center justify-center shadow-inner text-ink font-black text-xl">
            <span className="text-accent font-mono">₴</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black tracking-tight text-ink">Obmin<span className="text-accent">FX</span></h1>
              <span className="hidden min-[400px]:inline whitespace-nowrap text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-accent/[0.06] text-accent border border-accent/[0.18]">
                {t('nav.liveFx')}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted font-mono mt-0.5 whitespace-nowrap min-w-0">
              <span className="inline-block shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate">{currentSource.shortName} &bull; {formatLastUpdated(lastUpdatedTime)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onOpenSourceModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap rounded-full bg-card hover:bg-inset2 active:scale-95 text-ink2 border border-line/[0.08] text-xs font-bold transition-all shadow-sm"
            title={t('nav.sourcesTitle')}
          >
            <Globe className="w-3.5 h-3.5 text-accent" />
            <span>{t('nav.sources')}</span>
          </button>

          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onRefreshRates();
            }}
            disabled={isRefreshing}
            className="p-2 rounded-full bg-card hover:bg-inset2 active:scale-95 text-ink2 transition-all disabled:opacity-50 border border-line/[0.08]"
            title={t('nav.refresh')}
          >
            <RefreshCw className={'w-3.5 h-3.5 ' + (isRefreshing ? 'animate-spin text-accent' : '')} />
          </button>

          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onOpenSettingsModal();
            }}
            className="p-2 rounded-full bg-card hover:bg-inset2 active:scale-95 text-ink2 transition-all border border-line/[0.08]"
            title={t('nav.settings')}
          >
            <Settings className="w-3.5 h-3.5 text-ink2" />
          </button>
        </div>
      </div>

      {!isOnline && !isFallback && (
        <div className="mt-2 py-1 px-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center gap-1.5 text-xs text-amber-700 font-medium animate-pulse">
          <WifiOff className="w-3.5 h-3.5" /> {t('nav.offline')}
        </div>
      )}
      {isFallback && (
        <div className="mt-2 py-1 px-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center gap-1.5 text-xs text-rose-600 font-medium text-center">
          <WifiOff className="w-3.5 h-3.5 shrink-0" /> {t('nav.fallback')}
        </div>
      )}
    </header>
  );
};
