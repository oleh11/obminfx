const fs = require('fs');

// 1. BottomNavigation.tsx (5 Tabs: Converter, Bank Fee, Trends, Sources, Debug)
const bottomNav = `import React from 'react';
import { ArrowLeftRight, Percent, TrendingUp, Layers, Terminal } from 'lucide-react';
import { StorageService } from '../services/storageService';

export type AppTabType = 'converter' | 'fee_calculator' | 'trends' | 'sources' | 'debug';

interface BottomNavigationProps {
  activeTab: AppTabType;
  onTabChange: (tab: AppTabType) => void;
  bankFeePct: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  bankFeePct
}) => {
  const tabs = [
    {
      id: 'converter' as AppTabType,
      label: 'Converter',
      icon: ArrowLeftRight
    },
    {
      id: 'fee_calculator' as AppTabType,
      label: 'Bank Fee',
      icon: Percent,
      badge: bankFeePct > 0 ? \`\${bankFeePct}%\` : null
    },
    {
      id: 'trends' as AppTabType,
      label: 'Trends',
      icon: TrendingUp
    },
    {
      id: 'sources' as AppTabType,
      label: 'Sources',
      icon: Layers
    },
    {
      id: 'debug' as AppTabType,
      label: 'Debug',
      icon: Terminal
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c0e14]/95 backdrop-blur-xl border-t border-white/5 safe-area-pb">
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                StorageService.triggerHaptic();
                onTabChange(tab.id);
              }}
              className="flex flex-col items-center justify-center flex-1 py-1 group transition-all active:scale-95"
            >
              <div className={'relative px-3.5 py-1.5 rounded-full transition-all duration-200 flex items-center justify-center ' + (isActive ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 group-hover:text-slate-200')}>
                <Icon className={'w-4 h-4 transition-transform ' + (isActive ? 'scale-110 text-amber-400' : '')} />
                {tab.badge && !isActive && (
                  <span className="absolute -top-1 -right-1 text-[8px] font-black px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={'text-[10px] mt-1 tracking-tight transition-colors ' + (isActive ? 'text-amber-300 font-bold' : 'text-slate-400 font-medium')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
`;
fs.writeFileSync('src/components/BottomNavigation.tsx', bottomNav, 'utf8');

// 2. Navbar.tsx (With Last Pulled Date / Time indicator)
const navbar = `import React from 'react';
import { StorageService } from '../services/storageService';
import { RefreshCw, Globe, Settings, WifiOff, Clock } from 'lucide-react';
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
    if (!date) return 'Pulling live rates...';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c0e14]/95 backdrop-blur-xl border-b border-white/5 px-4 pb-2.5 safe-area-pt transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand & Last Updated status */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-[18px] bg-gradient-to-br from-amber-500/25 to-yellow-600/30 border border-amber-400/30 flex items-center justify-center shadow-inner text-amber-300 font-black text-xl">
            ₴
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-black tracking-tight text-white">Obmin<span className="text-amber-400">FX</span></h1>
              <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/25">
                {currentSource.shortName}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{formatLastUpdated(lastUpdatedTime)}</span>
            </div>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onOpenSourceModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181c26] hover:bg-[#222838] active:scale-95 text-slate-200 border border-white/5 text-xs font-semibold transition-all shadow-sm"
            title="Change exchange rate benchmark"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Sources</span>
          </button>

          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onRefreshRates();
            }}
            disabled={isRefreshing}
            className="p-2 rounded-full bg-[#181c26] hover:bg-[#222838] active:scale-95 text-slate-300 transition-all disabled:opacity-50 border border-white/5"
            title="Refresh exchange rates"
          >
            <RefreshCw className={'w-3.5 h-3.5 ' + (isRefreshing ? 'animate-spin text-amber-400' : '')} />
          </button>

          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onOpenSettingsModal();
            }}
            className="p-2 rounded-full bg-[#181c26] hover:bg-[#222838] active:scale-95 text-slate-300 transition-all border border-white/5"
            title="App settings"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
      </div>

      {!isOnline && (
        <div className="mt-2 py-1 px-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center gap-1.5 text-xs text-amber-300 font-medium animate-pulse">
          <WifiOff className="w-3.5 h-3.5" /> Working offline with cached rates
        </div>
      )}
    </header>
  );
};
`;
fs.writeFileSync('src/components/Navbar.tsx', navbar, 'utf8');

console.log('Navbar and BottomNavigation updated with 5 tabs & timestamp');
