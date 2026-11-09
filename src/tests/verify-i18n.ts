import { en } from '../i18n/en';
import { uk } from '../i18n/uk';
import { detectLang, translate, formatPct, localizeCurrency, sourceText } from '../i18n/core';
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
  const ukMap = uk as Record<string, string>;

  // 1. Every English key has a non-empty Ukrainian translation with the same placeholders
  const missing = enKeys.filter(k => !(k in ukMap));
  const empty = enKeys.filter(k => k in ukMap && !ukMap[k].trim());
  const badPlaceholders = enKeys.filter(k => k in ukMap && placeholders(en[k]) !== placeholders(ukMap[k]));
  const extra = Object.keys(uk).filter(k => !(k in en));
  assert(missing.length === 0, `All ${enKeys.length} en keys exist in uk`, `Missing: ${missing.join(', ')}`);
  assert(empty.length === 0, 'No empty uk strings', `Empty: ${empty.join(', ')}`);
  assert(enKeys.every(k => en[k].trim() !== ''), 'No empty en strings');
  assert(badPlaceholders.length === 0, 'uk placeholders match en', `Mismatch: ${badPlaceholders.join(', ')}`);
  assert(extra.length === 0, 'No stray uk keys', `Extra: ${extra.join(', ')}`);

  // 2. Every source and fee preset has text in both languages
  for (const s of AVAILABLE_SOURCES) {
    const ukText = sourceText('uk', s.id);
    assert(Object.values(ukText).every(v => v && !v.startsWith('source.')), `Source ${s.id} translated`);
  }
  assert(CARD_FEE_PRESETS.every(p => (`preset.${p.id}.tag` in ukMap)), 'Fee presets translated');

  // 3. Language detection and interpolation
  assert(detectLang('uk-UA') === 'uk' && detectLang('uk') === 'uk', 'Ukrainian device → uk');
  assert(detectLang('en-US') === 'en' && detectLang('pl-PL') === 'en' && detectLang(undefined) === 'en', 'Other devices → en');
  assert(translate('uk', 'conv.activeCount', { n: 5 }) === 'активних: 5', 'Interpolates {n}', translate('uk', 'conv.activeCount', { n: 5 }));
  assert(translate('en', 'trends.noData', { from: 'USD', to: 'UAH' }) === 'No rate history available for USD / UAH.', 'Interpolates several params');

  // 4. Locale-aware formatting
  assert(formatPct('uk', 2.5) === '2,5%', 'uk percent uses decimal comma', formatPct('uk', 2.5));
  assert(formatPct('en', 2.5) === '2.5%', 'en percent uses decimal point');
  assert(formatRate(41.4, 'uk-UA') === '41,4000', 'uk rate format', formatRate(41.4, 'uk-UA'));
  assert(formatRate(41.4) === '41.4000', 'Default rate format unchanged');
  const ukAmount = formatCurrencyAmount(1234.56, 2, false, '', 'uk-UA');
  assert(/^1\s234,56$/.test(ukAmount), 'uk amount uses space grouping and comma', ukAmount);

  // 5. Currency names in Ukrainian (Intl.DisplayNames, with English fallback)
  const usd = localizeCurrency(getCurrencyMeta('USD'), 'uk');
  assert(usd.name !== 'US Dollar' && /долар/i.test(usd.name), 'USD name in Ukrainian', usd.name);
  assert(localizeCurrency(getCurrencyMeta('BTC'), 'uk').name === 'Біткоїн', 'Crypto name from dictionary');
  assert(localizeCurrency(getCurrencyMeta('EUR'), 'uk').country === 'Єврозона', 'Eurozone label');
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
