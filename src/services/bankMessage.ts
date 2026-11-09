/**
 * Reads a bank notification or SMS ("Покупка 50,00 EUR, списано 2 613,28 ₴, баланс 10 234,55 ₴")
 * and finds the purchase amount, the amount taken from the card, and the date. Works for any currency.
 */
import { parseAmount } from './cardCostEstimator';

export interface MoneyAmount {
  amount: number;
  currency: string;
}

export interface BankMessage {
  purchase: MoneyAmount;
  charged: MoneyAmount | null;
  /** YYYY-MM-DD, when the message has a date */
  date: string | null;
}

// Symbols and words banks write instead of ISO codes. Ambiguous ones (kr, ¥ for CNY) are left out.
const CURRENCY_WORDS: [RegExp, string][] = [
  [/^(₴|грн\.?|гривень|гривні|гривня|uah)$/i, 'UAH'],
  [/^(us\$|\$|usd|дол\.?|доларів|долар)$/i, 'USD'],
  [/^(€|eur|євро)$/i, 'EUR'],
  [/^(£|gbp)$/i, 'GBP'],
  [/^(zł|zl|pln)$/i, 'PLN'],
  [/^(₹)$/, 'INR'],
  [/^(₺)$/, 'TRY'],
  [/^(₸)$/, 'KZT'],
  [/^(₾)$/, 'GEL'],
  [/^(₪)$/, 'ILS'],
  [/^(kč)$/i, 'CZK'],
  [/^(ft)$/i, 'HUF'],
  [/^(lei)$/i, 'RON'],
  [/^(лв\.?)$/i, 'BGN'],
  [/^(fr\.?|chf)$/i, 'CHF'],
];

// Text right before an amount that means it isn't the purchase or the charge
const NOT_A_PAYMENT = /(бал|залиш|доступ|ліміт|лимит|кредит|коміс|кешбек|cashback|balance|available|limit|credit|fee|commission|saldo|stan konta|guthaben|kontostand|solde)[^\d]{0,24}$/i;

const AMOUNT = /\d{1,3}(?:[   ]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?/g;
const TOKEN = /(US\$|[₴$€£₹₺₸₾₪]|[A-Za-zА-Яа-яІіЇїЄєҐґłŁčČ]+\.?)/y;

function currencyOf(token: string, knownCodes: ReadonlySet<string>): string | null {
  for (const [re, code] of CURRENCY_WORDS) if (re.test(token)) return code;
  const upper = token.replace(/\.$/, '').toUpperCase();
  return /^[A-Z]{3}$/.test(upper) && knownCodes.has(upper) ? upper : null;
}

function readDate(text: string): string | null {
  const iso = /\b(20\d{2})-(\d{2})-(\d{2})\b/.exec(text);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const m = /\b(\d{1,2})[./](\d{1,2})[./](\d{4}|\d{2})\b/.exec(text);
  if (!m) return null;
  const day = +m[1], month = +m[2];
  const year = m[3].length === 2 ? 2000 + +m[3] : +m[3];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Every amount with a currency written right before or after it, in the order they appear */
export function findAmounts(text: string, knownCodes: ReadonlySet<string>): (MoneyAmount & { index: number })[] {
  // Dates, times and masked card numbers look like amounts; blank them out first
  const clean = text
    .replace(/\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b/g, m => ' '.repeat(m.length))
    .replace(/\b20\d{2}-\d{2}-\d{2}\b/g, m => ' '.repeat(m.length))
    .replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, m => ' '.repeat(m.length))
    .replace(/[*•xX]\d{2,4}\b/g, m => ' '.repeat(m.length));

  const found: (MoneyAmount & { index: number })[] = [];
  for (const m of clean.matchAll(AMOUNT)) {
    const start = m.index!;
    const end = start + m[0].length;
    if (NOT_A_PAYMENT.test(clean.slice(Math.max(0, start - 40), start))) continue;

    // Currency right after ("50,00 EUR", "50€") ...
    let currency: string | null = null;
    const after = /^[   ]?/.exec(clean.slice(end))![0].length;
    TOKEN.lastIndex = end + after;
    const next = TOKEN.exec(clean);
    if (next) currency = currencyOf(next[1], knownCodes);
    // ... or right before ("EUR 50,00", "$50", "€ 50")
    if (!currency) {
      const before = /(US\$|[₴$€£₹₺₸₾₪]|[A-Za-zА-Яа-яІіЇїЄєҐґ]{2,}\.?)[   ]?[-−+]?$/.exec(clean.slice(Math.max(0, start - 12), start));
      if (before) currency = currencyOf(before[1], knownCodes);
    }
    if (!currency) continue;

    const amount = parseAmount(m[0], 'en');
    if (amount > 0) found.push({ amount, currency, index: start });
  }
  return found;
}

/**
 * The purchase is in one currency and the charge in another. The card's currency is picked from
 * `cardCurrencies` (the user's saved cards and home currency, most likely first); without a match,
 * the first amount in the message is taken as the purchase.
 * Returns null when the message has no amount with a currency.
 */
export function parseBankMessage(
  text: string,
  knownCodes: ReadonlySet<string>,
  cardCurrencies: string[] = []
): BankMessage | null {
  const amounts = findAmounts(text, knownCodes);
  if (amounts.length === 0) return null;

  // First amount per currency, in message order
  const byCurrency = new Map<string, MoneyAmount>();
  for (const a of amounts) if (!byCurrency.has(a.currency)) byCurrency.set(a.currency, { amount: a.amount, currency: a.currency });
  const currencies = [...byCurrency.keys()];
  const date = readDate(text);

  if (currencies.length === 1) {
    return { purchase: byCurrency.get(currencies[0])!, charged: null, date };
  }
  const card = cardCurrencies.find(c => byCurrency.has(c)) ?? currencies[1];
  const purchaseCurrency = currencies.find(c => c !== card)!;
  return { purchase: byCurrency.get(purchaseCurrency)!, charged: byCurrency.get(card)!, date };
}
