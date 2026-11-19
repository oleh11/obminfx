/**
 * Finds prices in text read from the camera (Tesseract words with their boxes).
 * Pure functions, so they can be tested without a camera.
 */

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrWord {
  text: string;
  confidence: number;
  bbox: Box;
}

export interface OcrLine {
  words: OcrWord[];
}

export interface FoundPrice {
  amount: number;
  /** Text as read, e.g. "1 299,00" */
  text: string;
  bbox: Box;
}

const MIN_CONFIDENCE = 45;
const MAX_AMOUNT = 10_000_000;

/**
 * Reads an amount from a price tag string. Handles 12.99, 12,99, 1,299.00, 1.299,00, 1 299, 1'299, 12,- and 12.–.
 * A single separator followed by exactly three digits is a thousands separator (1.299 = 1299).
 * Returns null when the text isn't a plausible price.
 */
export function parsePriceText(raw: string): number | null {
  // Keep digits and separators; "12,-" and "12.–" mean whole units
  let s = raw.replace(/[.,]\s*[-–—]+\s*$/, '').replace(/[^\d.,'\s]/g, '').trim();
  s = s.replace(/['\s]/g, ' ');
  if (!/\d/.test(s)) return null;
  // Spaces and apostrophes only group thousands: "1 299,00"
  if (/ /.test(s)) {
    if (!/^\d{1,3}( \d{3})+([.,]\d{1,2})?$/.test(s)) return null;
    s = s.replace(/ /g, '');
  }
  const seps = [...s.matchAll(/[.,]/g)];
  if (seps.length === 0) return finite(Number(s));
  const last = seps[seps.length - 1];
  const decimals = s.slice(last.index! + 1);
  const head = s.slice(0, last.index);
  const lastIsDecimal = decimals.length > 0 && decimals.length <= 2;
  if (lastIsDecimal) {
    // Everything before the decimal separator must be plain digits or groups of three
    if (!/^\d+$/.test(head)) {
      // Grouped thousands use the other separator: 1.299,00 or 1,299.00, never 12.999.99
      const group = last[0] === '.' ? ',' : '.';
      if (!new RegExp(`^\\d{1,3}(\\${group}\\d{3})+$`).test(head)) return null;
    }
    return finite(Number(head.replace(/[.,]/g, '') + '.' + decimals));
  }
  // No decimals: every separator must group thousands
  if (!/^\d{1,3}([.,]\d{3})+$/.test(s)) return null;
  return finite(Number(s.replace(/[.,]/g, '')));
}

function finite(n: number): number | null {
  return Number.isFinite(n) && n > 0 && n < MAX_AMOUNT ? n : null;
}

function union(a: Box, b: Box): Box {
  return { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) };
}

/** A word that could be a price on its own, or the start of "1 299,00" split by the reader */
const looksNumeric = (t: string) => /\d/.test(t) && /^[\d.,'\-–—$€£₴¥₹₽zł]*$/i.test(t);

/**
 * Prices in reading order. Joins thousands groups the reader split into separate words
 * ("1" "299,00"), skips low-confidence words and lone single digits (aisle numbers, sizes).
 */
export function findPrices(lines: OcrLine[]): FoundPrice[] {
  const found: FoundPrice[] = [];
  for (const line of lines) {
    const words = line.words.filter(w => w.confidence >= MIN_CONFIDENCE && looksNumeric(w.text.trim()));
    for (let i = 0; i < words.length; i++) {
      let text = words[i].text.trim();
      let bbox = words[i].bbox;
      // Join following groups of exactly three digits that sit close on the same line
      while (i + 1 < words.length && /^\d{1,3}$/.test(text.replace(/[^\d]/g, '')) && /^\d{3}([.,]\d{1,2})?$/.test(words[i + 1].text.trim())) {
        const next = words[i + 1];
        const gap = next.bbox.x0 - bbox.x1;
        const height = bbox.y1 - bbox.y0;
        if (gap > height * 1.2) break;
        text = `${text} ${next.text.trim()}`;
        bbox = union(bbox, next.bbox);
        i++;
      }
      const amount = parsePriceText(text);
      if (amount === null) continue;
      const digits = text.replace(/[^\d]/g, '');
      const hasDecimals = /[.,]\d{1,2}$/.test(text.replace(/[^\d.,]/g, ''));
      if (digits.length < 2 && !hasDecimals) continue;
      found.push({ amount, text, bbox });
    }
  }
  return found;
}

/** Share of the smaller box covered by the other */
function overlap(a: Box, b: Box): number {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  if (w <= 0 || h <= 0) return 0;
  const smaller = Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0));
  return smaller > 0 ? (w * h) / smaller : 0;
}

/** Prices from two reads of the same frame (normal and inverted), each price once */
export function mergePrices(first: FoundPrice[], second: FoundPrice[]): FoundPrice[] {
  const merged = [...first];
  for (const p of second) {
    if (!merged.some(m => overlap(m.bbox, p.bbox) > 0.5)) merged.push(p);
  }
  return merged;
}

/** Signs and codes that name exactly one currency ("$", "kr" and "¥" are shared, so they're left out) */
const CURRENCY_MARKS: [RegExp, string][] = [
  [/€|\bEUR\b/i, 'EUR'],
  [/£|\bGBP\b/i, 'GBP'],
  [/₴|\bUAH\b|грн/i, 'UAH'],
  [/zł|\bPLN\b/i, 'PLN'],
  [/₹|\bINR\b/i, 'INR'],
  [/₺|\bTRY\b/i, 'TRY'],
  [/₪|\bILS\b/i, 'ILS'],
  [/₩|\bKRW\b/i, 'KRW'],
  [/₫|\bVND\b/i, 'VND'],
  [/฿|\bTHB\b/i, 'THB'],
  [/Kč|\bCZK\b/i, 'CZK'],
  [/\bFt\b|\bHUF\b/i, 'HUF'],
  [/\bCHF\b/i, 'CHF'],
  [/\bUSD\b|US\$/i, 'USD'],
  [/\bCAD\b|C\$/i, 'CAD'],
  [/\bAUD\b|A\$/i, 'AUD'],
  [/\bJPY\b/i, 'JPY'],
  [/\bGEL\b|₾/i, 'GEL'],
  [/\bRON\b|\blei\b/i, 'RON'],
  [/\bMDL\b/i, 'MDL']
];

/** Currency named in a bit of text, or null */
export function currencyMark(text: string): string | null {
  for (const [re, code] of CURRENCY_MARKS) if (re.test(text)) return code;
  return null;
}

/**
 * The currency printed next to the prices, when the frame agrees on one ("€ 12,99", "45 zł").
 * Looks at each price's own text and its neighbours on the same line.
 */
export function detectCurrency(lines: OcrLine[]): string | null {
  const counts = new Map<string, number>();
  for (const line of lines) {
    const words = line.words.filter(w => w.confidence >= MIN_CONFIDENCE);
    words.forEach((w, i) => {
      if (!/\d/.test(w.text)) return;
      // The price's own sign first ("€12"), then a sign standing next to it ("€ 12", "12 zł")
      const neighbours = [words[i - 1]?.text, words[i + 1]?.text].filter((t): t is string => !!t && !/\d/.test(t));
      const code = currencyMark(w.text) ?? currencyMark(neighbours.join(' '));
      if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
    });
  }
  if (counts.size !== 1) return null;
  return [...counts.keys()][0];
}
