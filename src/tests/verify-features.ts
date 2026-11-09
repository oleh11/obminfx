import { parseBankMessage } from '../services/bankMessage';
import { parseNBUHistory, sampleDays } from '../services/rateService';
import { ALL_CURRENCIES } from '../data/currencies';
import { upsertCard, removeCard, rankCards } from '../services/cardsService';

let passed = 0;
let total = 0;
function assert(condition: boolean, testName: string, detail?: string) {
  total++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName} - ${detail || ''}`);
  }
}

console.log('=== Starting Bank Message & History Tests ===\n');
const codes = new Set(ALL_CURRENCIES.map(c => c.code));
const show = (x: unknown) => JSON.stringify(x);

// 1. Bank messages in different languages, orders and currencies
const mono = parseBankMessage('Покупка в Zara. 50,00 EUR (2 613,28 ₴). Баланс 10 234,55 ₴', codes, ['UAH']);
assert(mono?.purchase.amount === 50 && mono.purchase.currency === 'EUR' && mono.charged?.amount === 2613.28 && mono.charged.currency === 'UAH',
  'Ukrainian push: purchase and charge, balance ignored', show(mono));

const privat = parseBankMessage('2613.28UAH Оплата товарів i послуг. ZARA ESPANA. 06.11.2026 14:22. Бал. 10234.55UAH. Кред. ліміт 5000.00UAH (50.00EUR)', codes, ['UAH']);
assert(privat?.purchase.amount === 50 && privat.purchase.currency === 'EUR' && privat.charged?.amount === 2613.28,
  'SMS with the charge first, balance and limit ignored', show(privat));
assert(privat?.date === '2026-11-06', 'Date is read; the time is not taken as an amount', show(privat?.date));

const english = parseBankMessage('You spent €42.10 at Lidl. $46.35 was charged to your card ending *1234. Available balance $1,203.11', codes, ['USD']);
assert(english?.purchase.amount === 42.1 && english.purchase.currency === 'EUR' && english.charged?.amount === 46.35 && english.charged.currency === 'USD',
  'English message with symbols before amounts (USD card)', show(english));

const polish = parseBankMessage('Transakcja kartą 120,00 GBP, obciążenie 612,45 PLN, saldo 3 400,00 PLN', codes, []);
assert(polish?.purchase.currency === 'GBP' && polish.charged?.currency === 'PLN' && polish.charged.amount === 612.45,
  'Polish message without saved cards: second currency is the card', show(polish));

const home = parseBankMessage('Card payment 612,45 PLN for 120,00 GBP', codes, ['PLN']);
assert(home?.purchase.currency === 'GBP' && home.charged?.currency === 'PLN', 'Home currency decides which is the card, whatever the order', show(home));

const single = parseBankMessage('Списано 2 613,28 грн', codes, ['UAH']);
assert(single?.purchase.amount === 2613.28 && single.charged === null, 'One currency only: amount kept, no charge', show(single));

assert(parseBankMessage('Ваш код підтвердження 123456', codes) === null, 'No amount with a currency gives nothing');
assert(parseBankMessage('Paid 500 RUB', codes) === null, 'Excluded currencies are never read');

// 2. NBU history
const hist = parseNBUHistory([
  { exchangedate: '02.11.2026', rate: 45.35, units: 1 },
  { exchangedate: '01.11.2026', rate_per_unit: 45.53 },
  { exchangedate: 'bad', rate: 1 },
  { exchangedate: '03.11.2026', rate: 312.5, units: 10 },
]);
assert(hist.length === 3 && hist[0].date === '2026-11-01' && hist[2].rate === 31.25, 'NBU history is sorted, per unit, junk dropped', show(hist));
assert(parseNBUHistory(null).length === 0, 'A non-list gives no points');

const days = sampleDays('2021-11-09', '2026-11-09', 40);
assert(days.length === 40 && days[0] === '2021-11-09' && days[39] === '2026-11-09', 'Five years are sampled to 40 days including both ends', `${days.length} ${days[0]} ${days[39]}`);
assert(sampleDays('2026-11-02', '2026-11-09', 40).length === 8, 'A week gives every day');

// 3. Saved cards and the cheapest card
const t0 = 1_800_000_000_000;
let cards = upsertCard([], { name: 'Mono', currency: 'UAH', feePct: 2.43 }, t0);
cards = upsertCard(cards, { name: 'Wise', currency: 'EUR', feePct: 0.5 }, t0 + 1);
cards = upsertCard(cards, { name: 'Privat', currency: 'UAH', feePct: 3.1 }, t0 + 2);
cards = upsertCard(cards, { name: 'mono', currency: 'UAH', feePct: 1.9 }, t0 + 3);
assert(cards.length === 3 && cards[0].name === 'mono' && cards[0].feePct === 1.9, 'Saving the same card again updates it instead of adding', show(cards.map(c => c.name + c.feePct)));
assert(upsertCard(cards, { name: '   ', currency: 'UAH', feePct: 1 }).length === 3, 'A card needs a name');
assert(upsertCard([], { name: 'X', currency: 'USD', feePct: 99 })[0].feePct === 20, 'Fee is capped at 20%');
assert(removeCard(cards, cards[1].id).length === 2, 'Cards can be removed');

// 1 EUR = 51 UAH, 1 USD = 45 UAH
const uahPer: Record<string, number> = { UAH: 1, EUR: 51, USD: 45 };
const rate = (from: string, to: string) => (uahPer[from] && uahPer[to] ? uahPer[from] / uahPer[to] : NaN);
const ranked = rankCards(cards, 100, 'EUR', 'UAH', rate);
assert(ranked[0].card.name === 'Wise' && ranked[0].noConversion && ranked[0].cost === 100,
  'A card in the purchase currency converts nothing and wins', show(ranked.map(r => [r.card.name, r.cost])));
assert(ranked[1].card.name === 'mono' && Math.abs(ranked[1].cost - 5100 * 1.019) < 1e-6, 'Converting cards pay the rate plus their fee', show(ranked[1]));
assert(Math.abs(ranked[2].extraCompared - 5100 * (0.031 - 0)) < 1e-6 || Math.abs(ranked[2].extraCompared - (5100 * 1.031 - 5100)) < 1e-6,
  'Extra cost is measured against the cheapest card', show(ranked[2]));
const usdTrip = rankCards(cards, 100, 'USD', 'EUR', rate);
assert(usdTrip.every(r => !r.noConversion) && usdTrip[0].card.name === 'Wise', 'Works for any purchase and comparison currency', show(usdTrip.map(r => r.card.name)));
assert(rankCards(cards, 100, 'JPY', 'UAH', rate).length === 0, 'Cards without a rate for the purchase are left out');
assert(rankCards(cards, 0, 'EUR', 'UAH', rate).length === 0, 'No amount, no ranking');

console.log(`\n=== Feature Results: ${passed}/${total} Passed ===`);
if (passed !== total) throw new Error(`Feature tests failed: ${passed}/${total}`);
