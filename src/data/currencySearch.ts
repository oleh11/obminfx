import type { Currency } from '../types/currency';

/** Lower-case and strip accents, so "zloty" finds "Złoty" and "Kuna" finds "kuna". */
export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    // Letters that aren't "base letter + accent" in Unicode
    .replace(/[łøđðþßæœ]/g, ch => SPECIAL_LETTERS[ch])
    .trim();
}

const SPECIAL_LETTERS: Record<string, string> = { ł: 'l', ø: 'o', đ: 'd', ð: 'd', þ: 'th', ß: 'ss', æ: 'ae', œ: 'oe' };

/**
 * True when the search term appears in the currency's code, or in its name or country
 * in English or in the UI language (pass the localized copy as `localized`).
 */
export function currencyMatches(term: string, currency: Currency, localized: Currency = currency): boolean {
  const q = normalizeSearch(term);
  if (!q) return true;
  return [currency.code, currency.name, currency.country, localized.name, localized.country]
    .some(field => normalizeSearch(field).includes(q));
}
