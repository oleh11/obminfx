import { estimateCardCost, settlementDates, presetFromEstimate, parseAmount } from '../services/cardCostEstimator';
import { RateService } from '../services/rateService';

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
const near = (a: number, b: number, eps = 0.005) => Math.abs(a - b) < eps;

async function runTests() {
  console.log('=== Starting Card Cost Estimator Tests ===\n');

  // 1. The example from the design: 50 EUR charged as 2,350 UAH, official rate 45.80
  const e = estimateCardCost(50, 2350, [{ date: '2026-11-05', rate: 45.8 }])!;
  assert(near(e.effectiveRate, 47), 'Effective rate is 47.00 UAH per EUR', `${e.effectiveRate}`);
  assert(near(e.markupPct, 2.62), 'Markup over the official rate is 2.62%', `${e.markupPct}`);
  assert(near(e.extraCost, 60), 'Extra cost is 60 UAH', `${e.extraCost}`);
  assert(near(e.officialCost, 2290), 'Official cost is 2,290 UAH', `${e.officialCost}`);

  // 2. Range over posting days
  const r = estimateCardCost(50, 2350, [
    { date: '2026-11-05', rate: 45.8 }, { date: '2026-11-06', rate: 45.9 }, { date: '2026-11-07', rate: 45.6 },
  ])!;
  assert(near(r.markupPct, 2.62), 'Headline markup uses the purchase day');
  assert(r.minPct < r.markupPct && r.maxPct > r.markupPct, 'Range covers the posting days', `${r.minPct}..${r.maxPct}`);
  assert(near(r.minPct, (47 / 45.9 - 1) * 100) && near(r.maxPct, (47 / 45.6 - 1) * 100), 'Range ends are the best and worst day');

  // 3. A better-than-official rate gives a negative markup, not an error
  const neg = estimateCardCost(100, 4550, [{ date: '2026-11-05', rate: 45.8 }])!;
  assert(neg.markupPct < 0 && neg.extraCost < 0, 'Rate better than official gives a negative markup', `${neg.markupPct}`);

  // 4. Bad input
  assert(estimateCardCost(0, 100, [{ date: 'x', rate: 1 }]) === null, 'Zero purchase amount gives no estimate');
  assert(estimateCardCost(10, -5, [{ date: 'x', rate: 1 }]) === null, 'Negative charge gives no estimate');
  assert(estimateCardCost(10, 10, []) === null, 'No official rate gives no estimate');
  assert(estimateCardCost(NaN, 10, [{ date: 'x', rate: 1 }]) === null, 'NaN input gives no estimate');

  // 5. Posting days
  assert(settlementDates('2026-10-30', '2026-11-09').join() === '2026-10-30,2026-10-31,2026-11-01,2026-11-02', 'Posting days cross a month end');
  assert(settlementDates('2026-11-08', '2026-11-09').join() === '2026-11-08,2026-11-09', 'Posting days stop at today');
  assert(settlementDates('2026-12-01', '2026-11-09').length === 0, 'A future purchase date gives no days');
  assert(settlementDates('', '2026-11-09').length === 0, 'An empty date gives no days');

  // 6. Saving as the card preset
  assert(presetFromEstimate(2.62) === 2.6, 'Preset rounds to one decimal');
  assert(presetFromEstimate(-1.2) === 0, 'Negative markup saves as 0%');
  assert(presetFromEstimate(25) === 10, 'Preset is capped at 10%');
  assert(presetFromEstimate(NaN) === 0, 'NaN saves as 0%');

  // 7. Amounts typed or pasted from bank apps
  const cases: [string, string, number][] = [
    ['2 350,00', 'uk', 2350], ['2350,5', 'uk', 2350.5], ['2,350.00', 'en', 2350], ['2.350,00', 'uk', 2350],
    ['2,350', 'en', 2350], ['47,5', 'en', 47.5], ['2,350', 'uk', 2.35], ['50', 'en', 50], ['0.99', 'en', 0.99],
    ['2 350,00', 'uk', 2350],
  ];
  for (const [text, lang, want] of cases) {
    assert(parseAmount(text, lang) === want, `"${text}" (${lang}) reads as ${want}`, `${parseAmount(text, lang)}`);
  }
  assert(isNaN(parseAmount('', 'en')) && isNaN(parseAmount('abc', 'en')) && isNaN(parseAmount('1,2,3', 'uk')) && isNaN(parseAmount('-5', 'en')), 'Junk reads as NaN');

  // 8. Official rate lookup: NBU for UAH pairs, ECB otherwise, with a fallback (network mocked)
  const calls: string[] = [];
  const nbuDay: Record<string, number> = { '20261105': 45.8, '20261106': 45.9 };
  (globalThis as any).fetch = async (url: string) => {
    calls.push(url);
    const json = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
    if (url.includes('bank.gov.ua')) {
      const day = /date=(\d{8})/.exec(url)?.[1] ?? '';
      if (!nbuDay[day]) return json([]);
      return json([{ cc: 'USD', rate: 41.2 }, { cc: 'EUR', rate: nbuDay[day] }]);
    }
    if (url.includes('frankfurter')) {
      if (url.includes('symbols=XYZ') || url.includes('base=XYZ')) return { ok: false, status: 404, json: async () => ({}) };
      return json({ rates: { PLN: 4.39, EUR: 0.27 } });
    }
    throw new Error('unexpected ' + url);
  };

  const uah = await RateService.getOfficialRates('EUR', 'UAH', ['2026-11-05', '2026-11-06']);
  assert(uah?.source === 'nbu', 'EUR → UAH uses the NBU', JSON.stringify(uah));
  assert(!!uah && near(uah.rates[0].rate, 45.8, 1e-9) && near(uah.rates[1].rate, 45.9, 1e-9), 'NBU cross rate is UAH per EUR', JSON.stringify(uah?.rates));
  assert(calls.some(u => u.includes('date=20261105')), 'NBU is asked for the purchase date', calls.join(' '));

  const pln = await RateService.getOfficialRates('EUR', 'PLN', ['2026-11-05']);
  assert(pln?.source === 'ecb' && near(pln.rates[0].rate, 4.39, 1e-9), 'EUR → PLN uses the ECB', JSON.stringify(pln));

  const usd = await RateService.getOfficialRates('USD', 'UAH', ['2026-11-04']);
  assert(usd === null, 'No rate from either source gives null', JSON.stringify(usd));

  const btc = await RateService.getOfficialRates('BTC', 'UAH', ['2026-11-05']);
  assert(btc === null, 'Crypto has no official rate');

  console.log(`\n=== Card Cost Results: ${passed}/${total} Passed ===`);
  if (passed !== total) throw new Error(`Card cost tests failed: ${passed}/${total}`);
}

runTests().catch(e => { console.error(e); process.exit(1); });
