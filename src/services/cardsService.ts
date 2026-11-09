/**
 * The user's saved cards ("Mono black, UAH, 2.4%") and which one is cheapest for a purchase.
 * Works for any currencies: costs are compared in the user's home currency.
 */

export interface SavedCard {
  id: string;
  name: string;
  /** The card's account currency */
  currency: string;
  /** Conversion fee over the official rate, in %, measured with Check my card or typed in */
  feePct: number;
  updatedAt: number;
}

export interface CardCost {
  card: SavedCard;
  /** What the purchase costs on this card, in the card's currency */
  cost: number;
  /** The same cost in the comparison currency, for ranking */
  costCompared: number;
  /** Extra over the cheapest card, in the comparison currency (0 for the cheapest) */
  extraCompared: number;
  /** True when the card is in the purchase currency, so nothing is converted */
  noConversion: boolean;
}

export const CARDS_STORAGE_KEY = 'app_cards_v1';
export const MAX_CARDS = 12;

function isCard(c: any): c is SavedCard {
  return c && typeof c.id === 'string' && typeof c.name === 'string' && c.name.trim() !== ''
    && typeof c.currency === 'string' && /^[A-Z]{3}$/.test(c.currency)
    && typeof c.feePct === 'number' && isFinite(c.feePct) && c.feePct >= 0 && c.feePct <= 20;
}

export function loadCards(): SavedCard[] {
  try {
    const list = JSON.parse(localStorage.getItem(CARDS_STORAGE_KEY) || '[]');
    return Array.isArray(list) ? list.filter(isCard).slice(0, MAX_CARDS) : [];
  } catch {
    return [];
  }
}

export function storeCards(cards: SavedCard[]): void {
  try {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards.slice(0, MAX_CARDS)));
  } catch {}
}

/**
 * Adds a card, or updates the one with the same name and currency (names compare without case).
 * Returns the new list, newest first.
 */
export function upsertCard(cards: SavedCard[], input: { name: string; currency: string; feePct: number }, now = Date.now()): SavedCard[] {
  const name = input.name.trim().slice(0, 40);
  if (!name) return cards;
  const feePct = Math.min(20, Math.max(0, Math.round(input.feePct * 100) / 100));
  const same = (c: SavedCard) => c.name.toLowerCase() === name.toLowerCase() && c.currency === input.currency;
  const existing = cards.find(same);
  const card: SavedCard = { id: existing?.id ?? `c${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, currency: input.currency, feePct, updatedAt: now };
  return [card, ...cards.filter(c => !same(c))].slice(0, MAX_CARDS);
}

export function removeCard(cards: SavedCard[], id: string): SavedCard[] {
  return cards.filter(c => c.id !== id);
}

/**
 * Ranks the cards for a purchase, cheapest first.
 * `rate(from, to)` gives units of `to` per 1 `from` at the official/market rate (NaN when unknown).
 * A card in the purchase currency converts nothing, so its fee doesn't apply.
 * Cards whose currency has no rate are left out.
 */
export function rankCards(
  cards: SavedCard[],
  amount: number,
  purchaseCurrency: string,
  compareCurrency: string,
  rate: (from: string, to: string) => number
): CardCost[] {
  if (!(amount > 0)) return [];
  const rows: Omit<CardCost, 'extraCompared'>[] = [];
  for (const card of cards) {
    const noConversion = card.currency === purchaseCurrency;
    const r = noConversion ? 1 : rate(purchaseCurrency, card.currency);
    const toCompare = card.currency === compareCurrency ? 1 : rate(card.currency, compareCurrency);
    if (!(r > 0) || !(toCompare > 0)) continue;
    const cost = amount * r * (noConversion ? 1 : 1 + card.feePct / 100);
    rows.push({ card, cost, costCompared: cost * toCompare, noConversion });
  }
  rows.sort((a, b) => a.costCompared - b.costCompared);
  const best = rows[0]?.costCompared ?? 0;
  return rows.map(r => ({ ...r, extraCompared: r.costCompared - best }));
}
