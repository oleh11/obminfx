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
