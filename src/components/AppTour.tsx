import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ArrowLeftRight, Percent, TrendingUp, Layers, ShieldCheck, LucideIcon } from 'lucide-react';
import { useT, TKey } from '../i18n';
import { StorageService } from '../services/storageService';
import { AppTabType } from './BottomNavigation';

interface TourStep {
  /** Tab shown behind the card and pointed at in the bottom bar; null for the last, general step */
  tab: AppTabType | null;
  icon: LucideIcon;
  title: TKey;
  body: TKey;
}

const STEPS: TourStep[] = [
  { tab: 'converter', icon: ArrowLeftRight, title: 'tour.converter.title', body: 'tour.converter.body' },
  { tab: 'fee_calculator', icon: Percent, title: 'tour.fee.title', body: 'tour.fee.body' },
  { tab: 'trends', icon: TrendingUp, title: 'tour.trends.title', body: 'tour.trends.body' },
  { tab: 'sources', icon: Layers, title: 'tour.sources.title', body: 'tour.sources.body' },
  { tab: null, icon: ShieldCheck, title: 'tour.privacy.title', body: 'tour.privacy.body' }
];

interface AppTourProps {
  isOpen: boolean;
  /** Switches the visible tab so each step shows the screen it describes */
  onShowTab: (tab: AppTabType) => void;
  onClose: () => void;
}

/** First-launch walkthrough: one card per tab, pointing at it in the bottom bar, with Skip on every step. */
export const AppTour: React.FC<AppTourProps> = ({ isOpen, onShowTab, onClose }) => {
  const { t } = useT();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (isOpen) setIndex(0);
  }, [isOpen]);

  const step = STEPS[index];
  useEffect(() => {
    if (isOpen && step.tab) onShowTab(step.tab);
  }, [isOpen, step, onShowTab]);

  // Measure the bottom bar so the card sits above it and points at the right tab
  const [layout, setLayout] = useState<{ navTop: number; tabX: number | null }>({ navTop: 80, tabX: null });
  useLayoutEffect(() => {
    if (!isOpen) return;
    const measure = () => {
      const nav = document.querySelector('nav[data-bottom-nav]');
      if (!nav) return;
      const navRect = nav.getBoundingClientRect();
      const tabEl = step.tab ? nav.querySelector(`[data-tab="${step.tab}"]`) : null;
      const tabRect = tabEl?.getBoundingClientRect();
      setLayout({
        navTop: window.innerHeight - navRect.top,
        tabX: tabRect ? tabRect.left + tabRect.width / 2 : null
      });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const isLast = index === STEPS.length - 1;
  const finish = () => {
    StorageService.triggerHaptic();
    onShowTab('converter');
    onClose();
  };
  const next = () => {
    StorageService.triggerHaptic();
    if (isLast) finish();
    else setIndex(index + 1);
  };

  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* Dim everything above the bottom bar so the highlighted tab stays visible */}
      <div className="absolute inset-x-0 top-0 bg-black/50" style={{ bottom: layout.navTop }} />

      <div className="relative px-4" style={{ paddingBottom: layout.navTop + 12 }}>
        <div className="mx-auto max-w-lg rounded-[24px] bg-card border border-line/[0.08] shadow-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted">
              {t('tour.step', { n: index + 1, total: STEPS.length })}
            </span>
            {!isLast && (
              <button onClick={finish} className="text-xs font-bold text-muted hover:text-ink px-2 py-1 -mr-2">
                {t('tour.skip')}
              </button>
            )}
          </div>

          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center">
              <Icon className="w-5 h-5 text-accent" />
            </div>
            <div className="space-y-1">
              <h2 id="tour-title" className="text-base font-black text-ink leading-snug">{t(step.title)}</h2>
              <p className="text-xs text-ink2 leading-relaxed">{t(step.body)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-1.5" aria-hidden="true">
              {STEPS.map((_, i) => (
                <span key={i} className={'h-1.5 rounded-full transition-all ' + (i === index ? 'w-5 bg-accent' : 'w-1.5 bg-line/20')} />
              ))}
            </div>
            <button
              onClick={next}
              className="px-5 py-2.5 rounded-2xl bg-accent hover:bg-accent/85 text-onaccent font-bold text-xs transition-all"
            >
              {isLast ? t('tour.start') : t('tour.next')}
            </button>
          </div>
        </div>

        {/* Pointer to the tab this step is about */}
        {layout.tabX !== null && (
          <div
            className="absolute w-4 h-4 -translate-x-1/2 rotate-45 bg-card border-r border-b border-line/[0.08]"
            style={{ left: layout.tabX, bottom: layout.navTop + 5 }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
};
