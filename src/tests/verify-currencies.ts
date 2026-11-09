import { resolveCurrency, getCurrencyMeta } from '../data/currencies';
import { currencyMatches } from '../data/currencySearch';
import { localizeCurrency } from '../i18n/core';
import { RateService } from '../services/rateService';
import type { ExchangeRateData } from '../types/currency';

// Every code open.er-api.com returned on 2026-11-08 (static list: no network in tests)
const ER_API_CODES = (
  'USD AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BRL BSD BTN BWP BYN BZD ' +
  'CAD CDF CHF CLF CLP CNH CNY COP CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP FOK GBP GEL GGP ' +
  'GHS GIP GMD GNF GTQ GYD HKD HNL HRK HTG HUF IDR ILS IMP INR IQD IRR ISK JEP JMD JOD JPY KES KGS KHR KID ' +
  'KMF KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD ' +
  'NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE ' +
  'SLL SOS SRD SSP STN SYP SZL THB TJS TMT TND TOP TRY TTD TVD TWD TZS UAH UGX UYU UZS VES VND VUV WST XAF ' +
  'XCD XCG XDR XOF XPF YER ZAR ZMW ZWG ZWL'
).split(' ');
const EXTRA_CODES = ['BTC', 'ETH', 'SOL', 'USDT', 'XAU', 'XAG', 'XPT', 'XPD'];

function runTests() {
  console.log('=== Starting Currency Name & Search Tests ===\n');
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

  // 1. Every code the rate APIs return resolves to a real name and country
  const all = [...ER_API_CODES, ...EXTRA_CODES];
  const unnamed = all.filter(code => {
    const c = resolveCurrency(code);
    return c.name === code + ' Currency' || c.name === code || c.country === 'Global';
  });
  assert(unnamed.length === 0, `All ${all.length} API codes have an English name and country`, unnamed.join(', '));

  const ukUnnamed = all.filter(code => {
    const c = localizeCurrency(resolveCurrency(code), 'uk');
    return c.name.startsWith('Валюта ') || c.name === code || c.country === 'Світ';
  });
  assert(ukUnnamed.length === 0, 'All API codes have a Ukrainian name and country', ukUnnamed.join(', '));

  const rub = getCurrencyMeta('RUB');
  assert(rub.name === 'Russian Ruble' && rub.country === 'Russia', 'RUB is Russian Ruble / Russia', `${rub.name} / ${rub.country}`);
  const afn = resolveCurrency('AFN');
  assert(afn.name === 'Afghan Afghani' && afn.country === 'Afghanistan' && afn.flag === '🇦🇫', 'Intl fallback gives name, country and flag (AFN)', `${afn.name} / ${afn.country} / ${afn.flag}`);
  assert(resolveCurrency('XOF').country === 'West Africa', 'Multi-country code gets a region, not a fake country');

  // 2. Search: English and Ukrainian names, countries, codes, accents
  const pickerList = RateService.getAvailableCurrenciesFromRates({
    base: 'USD', date: '2026-11-08', timestamp: 0, source: 'open_market',
    rates: Object.fromEntries(ER_API_CODES.map(c => [c, 1]))
  } as ExchangeRateData);
  const search = (term: string, lang: 'en' | 'uk') =>
    pickerList.filter(c => currencyMatches(term, c, localizeCurrency(c, lang))).map(c => c.code);

  assert(search('Russ', 'en').includes('RUB'), '"Russ" finds RUB', search('Russ', 'en').join(','));
  assert(search('Russ', 'uk').includes('RUB'), '"Russ" still finds RUB with the Ukrainian UI');
  assert(search('рубль', 'uk').includes('RUB'), '"рубль" finds RUB', search('рубль', 'uk').join(','));
  assert(search('гривня', 'uk').includes('UAH'), '"гривня" finds UAH');
  assert(search('Україна', 'uk').includes('UAH'), '"Україна" finds UAH by country');
  assert(search('zloty', 'en').includes('PLN'), '"zloty" finds PLN (accent-insensitive)');
  assert(search('afghan', 'en').includes('AFN'), 'Codes without built-in metadata are searchable by name');
  assert(search('qwertyxyz', 'en').length === 0, 'Nonsense finds nothing');
  assert(currencyMatches('  ', getCurrencyMeta('USD')), 'Empty search matches everything');

  console.log(`\n=== Currency Results: ${passed}/${total} Passed ===`);
  if (passed !== total) throw new Error(`Currency tests failed: ${passed}/${total}`);
}

runTests();
