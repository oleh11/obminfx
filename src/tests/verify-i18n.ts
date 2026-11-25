import { en } from '../i18n/en';
import { uk } from '../i18n/uk';
import { pl } from '../i18n/pl';
import { de } from '../i18n/de';
import { detectLang, translate, formatPct, localizeCurrency, sourceText, Lang } from '../i18n/core';
import { AVAILABLE_SOURCES, CARD_FEE_PRESETS, getCurrencyMeta } from '../data/currencies';
import { formatCurrencyAmount, formatRate } from '../services/feeCalculator';

function runTests() {
  console.log('=== Starting i18n Tests ===\n');
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

  const placeholders = (s: string) => (s.match(/\{\w+\}/g) || []).sort().join(',');
  const enKeys = Object.keys(en) as (keyof typeof en)[];
  assert(enKeys.every(k => en[k].trim() !== ''), 'No empty en strings');

  const others: [Lang, Record<string, string>][] = [
    ['uk', uk],
    ['pl', pl],
    ['de', de],
  ];

  // 1. Every non-English dictionary has 100% key and placeholder parity with en
  for (const [langCode, map] of others) {
    const missing = enKeys.filter(k => !(k in map));
    const empty = enKeys.filter(k => k in map && !map[k].trim());
    const badPlaceholders = enKeys.filter(k => k in map && placeholders(en[k]) !== placeholders(map[k]));
    const extra = Object.keys(map).filter(k => !(k in en));
    assert(missing.length === 0, `All ${enKeys.length} en keys exist in ${langCode}`, `Missing: ${missing.join(', ')}`);
    assert(empty.length === 0, `No empty ${langCode} strings`, `Empty: ${empty.join(', ')}`);
    assert(badPlaceholders.length === 0, `${langCode} placeholders match en`, `Mismatch: ${badPlaceholders.join(', ')}`);
    assert(extra.length === 0, `No stray ${langCode} keys`, `Extra: ${extra.join(', ')}`);

    // 2. Every source and fee preset is translated
    for (const s of AVAILABLE_SOURCES) {
      const text = sourceText(langCode, s.id);
      assert(Object.values(text).every(v => v && !v.startsWith('source.')), `${langCode}: Source ${s.id} translated`);
    }
    assert(CARD_FEE_PRESETS.every(p => (`preset.${p.id}.tag` in map)), `${langCode}: Fee presets translated`);
  }

  // 3. Language detection and interpolation
  assert(detectLang('uk-UA') === 'uk' && detectLang('uk') === 'uk', 'Ukrainian device → uk');
  assert(detectLang('pl-PL') === 'pl' && detectLang('pl') === 'pl', 'Polish device → pl');
  assert(detectLang('de-DE') === 'de' && detectLang('de-AT') === 'de', 'German device → de');
  assert(detectLang('en-US') === 'en' && detectLang('fr-FR') === 'en' && detectLang(undefined) === 'en', 'Other devices → en');
  assert(translate('uk', 'conv.activeCount', { n: 5 }) === 'активних: 5', 'Interpolates {n}', translate('uk', 'conv.activeCount', { n: 5 }));
  assert(translate('en', 'trends.noData', { from: 'USD', to: 'UAH' }) === 'No rate history available for USD / UAH.', 'Interpolates several params');

  // 4. Locale-aware formatting
  assert(formatPct('uk', 2.5) === '2,5%', 'uk percent uses decimal comma', formatPct('uk', 2.5));
  assert(formatPct('en', 2.5) === '2.5%', 'en percent uses decimal point');
  assert(formatRate(41.4, 'uk-UA') === '41,4000', 'uk rate format', formatRate(41.4, 'uk-UA'));
  assert(formatRate(41.4) === '41.4000', 'Default rate format unchanged');
  const ukAmount = formatCurrencyAmount(1234.56, 2, false, '', 'uk-UA');
  assert(/^1\s234,56$/.test(ukAmount), 'uk amount uses space grouping and comma', ukAmount);

  // 5. Currency names in Ukrainian, Polish, and German (with English fallback)
  const usdUk = localizeCurrency(getCurrencyMeta('USD'), 'uk');
  assert(usdUk.name !== 'US Dollar' && /долар/i.test(usdUk.name), 'USD name in Ukrainian', usdUk.name);
  assert(localizeCurrency(getCurrencyMeta('BTC'), 'uk').name === 'Біткоїн', 'Crypto name from dictionary');
  assert(localizeCurrency(getCurrencyMeta('EUR'), 'uk').country === 'Єврозона', 'Eurozone label (uk)');
  assert(localizeCurrency(getCurrencyMeta('USD'), 'pl').name !== 'US Dollar', 'USD name in Polish');
  assert(localizeCurrency(getCurrencyMeta('EUR'), 'pl').country === 'Strefa euro', 'Eurozone label (pl)');
  assert(localizeCurrency(getCurrencyMeta('USD'), 'de').name !== 'US Dollar', 'USD name in German');
  assert(localizeCurrency(getCurrencyMeta('EUR'), 'de').country === 'Eurozone', 'Eurozone label (de)');
  assert(localizeCurrency(getCurrencyMeta('BTC'), 'de').name === 'Bitcoin', 'Crypto name in German');
  assert(localizeCurrency(getCurrencyMeta('USD'), 'en').name === 'US Dollar', 'English keeps built-in names');
  const unknown = localizeCurrency(getCurrencyMeta('QQQ'), 'uk');
  assert(unknown.name === 'Валюта QQQ' && unknown.country === 'Світ', 'Unknown code falls back', `${unknown.name} / ${unknown.country}`);

  let crashed = false;
  try {
    for (const code of ['1INCH', 'usd', 'X', '', 'BTC-OLD']) localizeCurrency(getCurrencyMeta(code), 'uk');
  } catch { crashed = true; }
  assert(!crashed, 'Malformed currency codes do not throw');

  console.log(`\n=== i18n Results: ${passed}/${total} Passed ===`);
  if (passed !== total) throw new Error(`i18n tests failed: ${passed}/${total}`);
}

runTests();
