/**
 * The Converter's list order: favorites first, then A-Z, without the base currency.
 * Bank Fee, Trends and Sources open on the base and the first currency of this list.
 */
export function orderConverterCurrencies(pinned: string[], favorites: string[], base: string): string[] {
  return pinned
    .filter(c => c !== base)
    .sort((a, b) => {
      const aFav = favorites.includes(a);
      const bFav = favorites.includes(b);
      if (aFav !== bFav) return aFav ? -1 : 1;
      return a.localeCompare(b);
    });
}

/** Second currency for the other tabs: the top of the Converter list, or a sensible default when it's empty */
export function pairCurrency(pinned: string[], favorites: string[], base: string): string {
  return orderConverterCurrencies(pinned, favorites, base)[0] ?? (base === 'USD' ? 'EUR' : 'USD');
}

/** Price scanner dropdown: Converter's base (when different from home), Converter's list, then all other codes A-Z, excluding homeCurrency */
export function scannerCurrencyOptions(
  pinned: string[],
  favorites: string[],
  baseCurrency: string,
  homeCurrency: string,
  availableCodes: string[]
): string[] {
  const seen = new Set<string>([homeCurrency]);
  const out: string[] = [];
  const push = (code: string) => {
    if (code && !seen.has(code)) {
      seen.add(code);
      out.push(code);
    }
  };
  push(baseCurrency);
  for (const code of orderConverterCurrencies(pinned, favorites, homeCurrency)) push(code);
  for (const code of [...availableCodes].sort()) push(code);
  return out;
}

/** Default currency for price tags: Converter's base when traveling (base != home), else the top paired currency */
export function defaultScannerCurrency(
  pinned: string[],
  favorites: string[],
  baseCurrency: string,
  homeCurrency: string
): string {
  return baseCurrency !== homeCurrency ? baseCurrency : pairCurrency(pinned, favorites, homeCurrency);
}
