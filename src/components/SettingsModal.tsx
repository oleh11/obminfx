import React from 'react';
import { StorageService } from '../services/storageService';
import { Percent, ShieldAlert, Info, X, ArrowRightLeft, Languages } from 'lucide-react';
import { useT, LANGS, Lang } from '../i18n';

const LANGUAGE_NAMES: Record<Lang, string> = { en: 'English', uk: 'Українська' };

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
  const { t, pct, currency, lang, setLang } = useT();
  if (!isOpen) return null;

  const baseMeta = currency(baseCurrency);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-inset border border-line/[0.08] rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-line/[0.08] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">{t('settings.title')}</h2>
            <p className="text-xs text-muted">{t('settings.subtitle')}</p>
          </div>
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onClose();
            }}
            className="p-2 rounded-full bg-inset hover:bg-inset2 text-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Language */}
          <div className="p-4 rounded-2xl bg-inset border border-line/[0.08] space-y-2.5">
            <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-accent" />
              {t('settings.language')}
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {LANGS.map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    StorageService.triggerHaptic();
                    setLang(code);
                  }}
                  className={'py-2 rounded-xl text-xs font-extrabold border transition-all ' + (lang === code ? 'bg-accent text-onaccent border-accent' : 'bg-inset text-ink2 border-line/[0.08] hover:bg-inset2')}
                >
                  {LANGUAGE_NAMES[code]}
                </button>
              ))}
            </div>
          </div>

          {/* Default Base Currency Configuration */}
          <div className="p-4 rounded-2xl bg-inset border border-line/[0.08] space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-accent" />
                {t('settings.defaultBase')}
              </h3>
              <button
                onClick={() => {
                  StorageService.triggerHaptic();
                  onClose();
                  onOpenSelectBaseModal?.();
                }}
                className="text-xs font-bold text-accent hover:underline"
              >
                {t('settings.change')}
              </button>
            </div>
            <div 
              onClick={() => {
                StorageService.triggerHaptic();
                onClose();
                onOpenSelectBaseModal?.();
              }}
              className="p-3 rounded-xl bg-inset border border-line/[0.08] flex items-center justify-between cursor-pointer hover:border-accent/[0.18] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{baseMeta.flag}</span>
                <div>
                  <span className="font-extrabold text-sm text-ink">{baseMeta.code}</span>
                  <span className="text-xs text-muted ml-1.5">{baseMeta.name}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-accent">
                {baseMeta.symbol}
              </span>
            </div>
          </div>

          {/* Bank Fee Configuration */}
          <div className="p-4 rounded-2xl bg-inset border border-line/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-amber-700" />
                {t('settings.defaultFee')}
              </h3>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-500/15 px-2 py-0.5 rounded-lg">
                {pct(bankFeePct, 1)}
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
                  className={'py-2 rounded-xl text-xs font-extrabold border transition-all ' + (Math.abs(bankFeePct - fee) < 0.05 ? 'bg-amber-500/20 text-amber-700 border-amber-500 shadow-md ring-1 ring-amber-500/40' : 'bg-inset text-ink2 border-line/[0.08] hover:bg-inset2')}
                >
                  {fee === 0 ? t('common.feeFree') : fee === 2.0 ? t('common.feeAvg') : pct(fee)}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Defaults */}
          <div className="p-4 rounded-2xl border border-red-200 bg-red-50">
            <h4 className="text-sm font-bold text-ink mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-600" /> {t('settings.reset')}
            </h4>
            <p className="text-xs text-muted mb-3">
              {t('settings.resetBody')}
            </p>
            <button
              onClick={() => {
                StorageService.triggerHaptic();
                onResetDefaults();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-98 text-[#fff] font-bold text-xs transition-all shadow-md shadow-red-600/20"
            >
              {t('settings.resetButton')}
            </button>
          </div>

          {/* About ObminFX */}
          <div className="p-4 rounded-2xl border border-line/[0.08] bg-inset">
            <h3 className="text-sm font-bold text-ink mb-1.5 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-700" /> {t('settings.about')}
            </h3>
            <p className="text-xs text-ink2 leading-relaxed mb-2">
              <strong>ObminFX</strong> {t('settings.aboutBody1')}
            </p>
            <p className="text-[11px] text-muted">
              {t('settings.aboutBody2')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line/[0.08] bg-inset flex justify-end">
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onClose();
            }}
            className="px-5 py-2.5 rounded-2xl bg-accent hover:bg-accent/85 text-onaccent font-bold text-xs transition-all shadow-md shadow-amber-500/20"
          >
            {t('common.done')}
          </button>
        </div>
      </div>
    </div>
  );
};
