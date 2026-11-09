import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { TKey } from './en';
import type { Currency, RateSourceId } from '../types/currency';
import { getCurrencyMeta } from '../data/currencies';
import {
  Lang, TParams, LOCALES, LANG_STORAGE_KEY,
  detectLang, translate, formatPct, sourceText, localizeCurrency
} from './core';

export type { Lang, TKey };
export { LANGS } from './core';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'en' || saved === 'uk') return saved;
  } catch {}
  return detectLang(typeof navigator !== 'undefined' ? navigator.language : undefined);
}

export interface I18n {
  lang: Lang;
  /** BCP 47 locale for toLocaleString() etc. */
  locale: string;
  setLang: (lang: Lang) => void;
  t: (key: TKey, params?: TParams) => string;
  pct: (value: number, maxDigits?: number) => string;
  /** Currency metadata with name/country in the current language. */
  currency: (code: string) => Currency;
  localize: (c: Currency) => Currency;
  source: (id: RateSourceId) => ReturnType<typeof sourceText>;
}

const I18nContext = createContext<I18n | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try { localStorage.setItem(LANG_STORAGE_KEY, next); } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18n>(() => ({
    lang,
    locale: LOCALES[lang],
    setLang,
    t: (key, params) => translate(lang, key, params),
    pct: (v, d) => formatPct(lang, v, d),
    currency: (code) => localizeCurrency(getCurrencyMeta(code), lang),
    localize: (c) => localizeCurrency(c, lang),
    source: (id) => sourceText(lang, id)
  }), [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useT(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT() must be used inside <LanguageProvider>');
  return ctx;
}
