// Framework-free i18n helpers (used by the React provider and by tests).
import { en, Dict, TKey } from './en';
import { uk } from './uk';
import type { Currency, RateSourceId } from '../types/currency';

export type Lang = 'en' | 'uk';
export type TParams = Record<string, string | number>;

export const LANGS: Lang[] = ['en', 'uk'];
export const DICTIONARIES: Record<Lang, Dict> = { en, uk };
/** BCP 47 locale used for number/date formatting. */
export const LOCALES: Record<Lang, string> = { en: 'en-US', uk: 'uk-UA' };
export const LANG_STORAGE_KEY = 'app_language_v1';

/** Ukrainian if the device language is Ukrainian, otherwise English. */
export function detectLang(deviceLanguage?: string | null): Lang {
  return deviceLanguage && deviceLanguage.toLowerCase().startsWith('uk') ? 'uk' : 'en';
}

export function translate(lang: Lang, key: TKey, params?: TParams): string {
  const text = DICTIONARIES[lang][key] || en[key] || key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    params[name] !== undefined ? String(params[name]) : match
  );
}

/** "2%" / "2,5%" in the current locale. */
export function formatPct(lang: Lang, value: number, maxDigits = 2): string {
  return value.toLocaleString(LOCALES[lang], { maximumFractionDigits: maxDigits }) + '%';
}

export function sourceText(lang: Lang, id: RateSourceId) {
  const field = (f: string) => translate(lang, `source.${id}.${f}` as TKey);
  return {
    name: field('name'),
    shortName: field('shortName'),
    description: field('description'),
    badge: field('badge'),
    updateFrequency: field('updateFrequency')
  };
}

// Intl.DisplayNames instances are cached; they may be missing on very old WebViews.
type DisplayNamesLike = { of(code: string): string | undefined };
const displayNamesCache: Record<string, DisplayNamesLike | null> = {};
function displayNames(lang: Lang, type: 'currency' | 'region'): DisplayNamesLike | null {
  const cacheKey = lang + ':' + type;
  if (!(cacheKey in displayNamesCache)) {
    try {
      const DN = (Intl as any).DisplayNames;
      displayNamesCache[cacheKey] = DN ? new DN([LOCALES[lang]], { type, fallback: 'code' }) : null;
    } catch {
      displayNamesCache[cacheKey] = null;
    }
  }
  return displayNamesCache[cacheKey];
}

/** DisplayNames.of() throws on malformed codes (feeds sometimes send odd ones), so never let it escape. */
function displayName(lang: Lang, type: 'currency' | 'region', code: string): string | undefined {
  try {
    return displayNames(lang, type)?.of(code);
  } catch {
    return undefined;
  }
}

function capitalize(s: string, lang: Lang): string {
  return s ? s.charAt(0).toLocaleUpperCase(LOCALES[lang]) + s.slice(1) : s;
}

const localizedCache: Record<string, Currency> = {};

/**
 * Returns the currency with its name and country in the given language.
 * English uses the built-in metadata; other languages use Intl.DisplayNames and
 * fall back to the English names when the platform doesn't know the code.
 */
export function localizeCurrency(c: Currency, lang: Lang): Currency {
  if (lang === 'en') return c;
  const cacheKey = lang + ':' + c.code;
  const cached = localizedCache[cacheKey];
  if (cached) return cached;

  const dict = DICTIONARIES[lang] as Record<string, string>;
  let name = dict['cur.name.' + c.code];
  if (!name) {
    const fromIntl = c.type === 'fiat' ? displayName(lang, 'currency', c.code) : undefined;
    if (fromIntl && fromIntl.toUpperCase() !== c.code) name = capitalize(fromIntl, lang);
    else if (c.name === c.code + ' Currency') name = translate(lang, 'cur.unknownName', { code: c.code });
    else name = c.name;
  }

  let country: string;
  if (c.type === 'crypto') country = translate(lang, 'cur.country.crypto');
  else if (c.type === 'commodity') country = translate(lang, 'cur.country.commodity');
  else if (c.code === 'EUR') country = translate(lang, 'cur.country.eurozone');
  else if (dict['cur.country.' + c.code]) country = dict['cur.country.' + c.code];
  else if (c.code.startsWith('X')) country = c.country;
  else {
    const region = c.code.slice(0, 2);
    const fromIntl = displayName(lang, 'region', region);
    if (fromIntl && fromIntl !== region) country = fromIntl;
    else if (c.country === 'Global' || c.country === 'World') country = translate(lang, 'cur.country.global');
    else country = c.country;
  }

  const result = { ...c, name, country };
  localizedCache[cacheKey] = result;
  return result;
}
