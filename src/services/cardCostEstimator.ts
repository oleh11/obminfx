/**
 * Works out what a card really charged for a foreign purchase, from the two numbers in the bank app:
 * the purchase amount (e.g. 50.00 EUR) and the amount taken from the card (e.g. 2,350.00 UAH).
 * The result is compared with the official rate, so it covers the network rate and the bank's fee together.
 */

export interface ReferenceRate {
  /** YYYY-MM-DD the rate applies to */
  date: string;
  /** Units of card currency per 1 unit of purchase currency */
  rate: number;
}

export interface CardCostEstimate {
  /** Card currency per 1 unit of purchase currency that the user actually got */
  effectiveRate: number;
  /** Official rate on the purchase day */
  referenceRate: number;
  /** Total markup over the official rate on the purchase day, in % */
  markupPct: number;
  /** Lowest and highest markup across the days the bank may have posted the payment */
  minPct: number;
  maxPct: number;
  /** Extra paid compared with the official rate, in card currency */
  extraCost: number;
  /** What the purchase would have cost at the official rate, in card currency */
  officialCost: number;
}

/** How many days after the purchase a bank may post (settle) the payment */
export const SETTLEMENT_DAYS = 3;

/** Above this the numbers were probably typed in the wrong currency */
export const IMPLAUSIBLE_MARKUP_PCT = 15;

/** Card markups above this on a non-USD purchase often mean a double conversion (via USD) */
export const DOUBLE_CONVERSION_HINT_PCT = 3;

/**
 * Returns null when the inputs can't give a meaningful estimate.
 * `rates` must have the purchase day first, then the possible posting days.
 */
export function estimateCardCost(
  purchaseAmount: number,
  chargedAmount: number,
  rates: ReferenceRate[]
): CardCostEstimate | null {
  if (!(purchaseAmount > 0) || !(chargedAmount > 0) || !isFinite(purchaseAmount) || !isFinite(chargedAmount)) return null;
  const valid = rates.filter(r => r.rate > 0 && isFinite(r.rate));
  if (valid.length === 0) return null;

  const effectiveRate = chargedAmount / purchaseAmount;
  const markup = (ref: number) => (effectiveRate / ref - 1) * 100;
  const referenceRate = valid[0].rate;
  const all = valid.map(r => markup(r.rate));
  const officialCost = purchaseAmount * referenceRate;

  return {
    effectiveRate,
    referenceRate,
    markupPct: markup(referenceRate),
    minPct: Math.min(...all),
    maxPct: Math.max(...all),
    extraCost: chargedAmount - officialCost,
    officialCost,
  };
}

/** Purchase day plus the possible posting days, never after `today`. Dates are YYYY-MM-DD. */
export function settlementDates(purchaseDate: string, today: string, days: number = SETTLEMENT_DAYS): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) return [];
  const out: string[] = [];
  const d = new Date(purchaseDate + 'T12:00:00Z');
  for (let i = 0; i <= days; i++) {
    const s = d.toISOString().slice(0, 10);
    if (s > today) break;
    out.push(s);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/**
 * Reads an amount the way bank apps show it: "2 350,00", "2,350.00", "2350.5" or "47,5".
 * With both separators, the last one is the decimal point. A lone comma is a decimal comma,
 * except for an English-style thousands group like "2,350" when the language is English.
 * Returns NaN for anything else.
 */
export function parseAmount(text: string, lang: string = 'en'): number {
  let s = text.replace(/[\s  ']/g, '');
  if (!s) return NaN;
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot >= 0 && lastComma >= 0) {
    const dec = lastDot > lastComma ? '.' : ',';
    const thousands = dec === '.' ? ',' : '.';
    s = s.split(thousands).join('').replace(dec, '.');
  } else if (lastComma >= 0) {
    const thousandsGroups = /^\d{1,3}(,\d{3})+$/.test(s);
    s = lang === 'en' && thousandsGroups ? s.replace(/,/g, '') : s.split(',').length === 2 ? s.replace(',', '.') : '';
  }
  if (!/^\d*\.?\d+$|^\d+\.$/.test(s)) return NaN;
  return parseFloat(s);
}

/** Fee % to save as the user's card preset: one decimal, kept within the slider's 0–10% range */
export function presetFromEstimate(markupPct: number): number {
  if (!isFinite(markupPct)) return 0;
  return Math.min(10, Math.max(0, Math.round(markupPct * 10) / 10));
}
