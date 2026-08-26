import React from 'react';
import { ArrowLeftRight, Percent, TrendingUp, Layers, Terminal } from 'lucide-react';
import { StorageService } from '../services/storageService';

export type AppTabType = 'converter' | 'fee_calculator' | 'trends' | 'sources';

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
      badge: bankFeePct > 0 ? `${bankFeePct}%` : null
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
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b0e14]/95 backdrop-blur-xl border-t border-white/10 safe-area-pb">
      <div className="w-full max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
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
              <div className={'relative px-4 py-1.5 rounded-full transition-all duration-200 flex items-center justify-center ' + (isActive ? 'bg-[#D4FF00]/15 text-[#D4FF00] font-bold' : 'text-slate-400 group-hover:text-slate-200')}>
                <Icon className={'w-4 h-4 transition-transform ' + (isActive ? 'scale-110 text-[#D4FF00]' : '')} />
                {tab.badge && !isActive && (
                  <span className="absolute -top-1 -right-1 text-[8px] font-black px-1.5 py-0.2 rounded-full bg-[#D4FF00] text-slate-950">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={'text-[10px] mt-1 tracking-tight transition-colors ' + (isActive ? 'text-[#D4FF00] font-bold' : 'text-slate-400 font-medium')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
