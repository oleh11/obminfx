import React from 'react';
import { ArrowLeftRight, Percent, TrendingUp, Layers, Terminal } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { useT } from '../i18n';

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
  const { t, pct } = useT();
  const tabs = [
    {
      id: 'converter' as AppTabType,
      label: t('tab.converter'),
      icon: ArrowLeftRight
    },
    {
      id: 'fee_calculator' as AppTabType,
      label: t('tab.fee'),
      icon: Percent,
      badge: bankFeePct > 0 ? pct(bankFeePct) : null
    },
    {
      id: 'trends' as AppTabType,
      label: t('tab.trends'),
      icon: TrendingUp
    },
    {
      id: 'sources' as AppTabType,
      label: t('tab.sources'),
      icon: Layers
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-xl border-t border-line/[0.08] safe-area-pb">
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
              <div className={'relative px-4 py-1.5 rounded-full transition-all duration-200 flex items-center justify-center ' + (isActive ? 'bg-accent/[0.06] text-accent font-bold' : 'text-muted group-hover:text-ink2')}>
                <Icon className={'w-4 h-4 transition-transform ' + (isActive ? 'scale-110 text-accent' : '')} />
                {tab.badge && !isActive && (
                  <span className="absolute -top-1 -right-1 text-[8px] font-black px-1.5 py-0.2 rounded-full bg-accent text-onaccent">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={'text-[10px] mt-1 tracking-tight transition-colors ' + (isActive ? 'text-accent font-bold' : 'text-muted font-medium')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
