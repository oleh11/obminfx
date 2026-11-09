import { resolveCurrency, ALL_CURRENCIES, GLOBAL_CURRENCY_METADATA, isExcludedCurrency, withoutExcludedRates } from "../data/currencies";
import { Currency, RateSourceId, ExchangeRateData, HistoricalDataSummary, HistoricalRatePoint } from '../types/currency';

// Offline fallback rates (1 USD = X). Only used when no source can be reached;
// the result is flagged with isFallback so the UI can say so.
const BASELINE_RATES_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 0.9245,
  GBP: 0.7885,
  JPY: 154.65,
  CAD: 1.3820,
  AUD: 1.5240,
  CHF: 0.8920,
  CNY: 7.2350,
  INR: 83.45,
  MXN: 18.25,
  BRL: 5.48,
  KRW: 1385.0,
  SGD: 1.3520,
  NZD: 1.6450,
  HKD: 7.8120,
  SEK: 10.58,
  NOK: 10.65,
  DKK: 6.89,
  PLN: 3.96,
  TRY: 32.85,
  ZAR: 18.15,
  THB: 36.65,
  AED: 3.6725,
  SAR: 3.75,
  ILS: 3.72,
  CZK: 23.15,
  HUF: 364.50,
  PHP: 58.75,
  MYR: 4.71,
  IDR: 16380.0,
  VND: 25420.0,
  EGP: 47.90,
  CLP: 935.0,
  COP: 4120.0,
  PEN: 3.78,
  TWD: 32.45,
  ARS: 915.0,
  UAH: 40.85,
  RON: 4.60,
  BGN: 1.808,
  ISK: 139.5,
  KWD: 0.307,
  BHD: 0.377,
  OMR: 0.385,
  QAR: 3.64,
  JOD: 0.709,
};

// v2: v1 cache entries for card networks had the markup baked into the rates
const STORAGE_KEY_PREFIX = 'currency_rates_v2_';
const CACHE_TTL_MS = 30 * 60 * 1000;

export const CUSTOM_SPREAD_STORAGE_KEY = 'custom_bank_spread_pct';
export const DEFAULT_CUSTOM_SPREAD_PCT = 1.5;

// Typical card-network spreads over the market mid-rate. These are estimates:
// the app does not have access to Mastercard's or Visa's published rates.
export const CARD_NETWORK_MARKUP_PCT: Partial<Record<RateSourceId, number>> = {
  mastercard: 0.22,
  visa: 0.25,
};

// api.frankfurter.app redirects here, and the redirect has no CORS header
const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v1';
const ECB_URL = `${FRANKFURTER_BASE}/latest?base=USD`;
const OPEN_MARKET_URL = 'https://open.er-api.com/v6/latest/USD';
const NBU_URL = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json';
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether&vs_currencies=usd';
const METAL_PRICE_URL = (code: string) => `https://api.gold-api.com/price/${code}`;

const COINGECKO_IDS: Record<string, string> = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', USDT: 'tether' };
const METAL_CODES = ['XAU', 'XAG', 'XPT', 'XPD'];
const NON_FIAT_CODES = [...Object.keys(COINGECKO_IDS), ...METAL_CODES];

const today = () => new Date().toISOString().split('T')[0];

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

/**
 * Converts the NBU list (UAH per 1 unit of each currency) into rates per 1 USD.
 */
export function parseNBURates(list: unknown): Record<string, number> {
  if (!Array.isArray(list)) throw new Error('NBU response is not a list');
  const uahPerUnit: Record<string, number> = {};
  for (const item of list) {
    if (item && typeof item.cc === 'string' && typeof item.rate === 'number' && item.rate > 0) {
      uahPerUnit[item.cc.toUpperCase()] = item.rate;
    }
  }
  const uahPerUsd = uahPerUnit.USD;
  if (!uahPerUsd) throw new Error('NBU response has no USD rate');

  const rates: Record<string, number> = { USD: 1.0, UAH: uahPerUsd };
  for (const [code, uah] of Object.entries(uahPerUnit)) {
    if (code !== 'USD') rates[code] = uahPerUsd / uah;
  }
  return rates;
}

export class RateService {
  private static cachedData: Partial<Record<RateSourceId, ExchangeRateData>> = {};
  private static cryptoMetalsCache: { at: number; rates: Record<string, number> } | null = null;

  /**
   * Dynamically extracts all available currencies from live rate data and resolves metadata
   */
  public static getAvailableCurrenciesFromRates(rateData: ExchangeRateData | null): Currency[] {
    if (!rateData || !rateData.rates) {
      return ALL_CURRENCIES;
    }
    const codes = Object.keys(rateData.rates);
    const set = new Set<string>([rateData.base, ...codes, ...Object.keys(GLOBAL_CURRENCY_METADATA)]);
    return Array.from(set).filter(code => !isExcludedCurrency(code)).map(code => resolveCurrency(code));
  }

  /**
   * Fetches exchange rates for the selected source with caching and offline fallback
   */
  public static async getRates(sourceId: RateSourceId, forceRefresh: boolean = false): Promise<ExchangeRateData> {
    // Filter here so excluded currencies never come back, whether the rates are fresh, cached or older cache
    const data = await this.loadRates(sourceId, forceRefresh);
    return { ...data, rates: withoutExcludedRates(data.rates) };
  }

  private static async loadRates(sourceId: RateSourceId, forceRefresh: boolean): Promise<ExchangeRateData> {
    const cached = this.cachedData[sourceId];
    if (!forceRefresh && cached) {
      return cached;
    }

    const storageKey = `${STORAGE_KEY_PREFIX}${sourceId}`;
    let stored: ExchangeRateData | null = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) stored = JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to read cached rates', e);
    }

    if (stored && !forceRefresh && Date.now() - stored.timestamp < CACHE_TTL_MS) {
      this.cachedData[sourceId] = stored;
      return stored;
    }

    try {
      const fresh = await this.fetchSource(sourceId);
      try {
        localStorage.setItem(storageKey, JSON.stringify(fresh));
      } catch {}
      this.cachedData[sourceId] = fresh;
      return fresh;
    } catch (err) {
      console.warn(`Failed to fetch rates for ${sourceId}, using cache or offline rates`, err);

      // Older real rates beat the built-in table
      if (stored) {
        this.cachedData[sourceId] = stored;
        return stored;
      }

      // Not cached in memory, so the next call tries the network again
      return {
        base: 'USD',
        date: today(),
        timestamp: Date.now(),
        source: sourceId,
        rates: { ...BASELINE_RATES_USD },
        isFallback: true,
      };
    }
  }

  private static async fetchSource(sourceId: RateSourceId): Promise<ExchangeRateData> {
    switch (sourceId) {
      case 'ecb':
        return this.fetchECBRates();
      case 'nbu':
        return this.fetchNBURates();
      // Card networks and the custom bank use the market mid-rate;
      // their markup is applied in calculateRate.
      case 'mastercard':
      case 'visa':
      case 'custom_bank':
      case 'open_market':
      default:
        return this.fetchOpenMarketRates(sourceId);
    }
  }

  /**
   * European Central Bank rates via the Frankfurter API.
   * Currencies the ECB does not publish are filled from open-market rates.
   */
  private static async fetchECBRates(): Promise<ExchangeRateData> {
    const [ecb, market] = await Promise.allSettled([fetchJson(ECB_URL), fetchJson(OPEN_MARKET_URL)]);
    if (ecb.status !== 'fulfilled' || !ecb.value?.rates) {
      throw ecb.status === 'rejected' ? ecb.reason : new Error('ECB response has no rates');
    }
    const marketRates = market.status === 'fulfilled' ? market.value?.rates || {} : {};

    return {
      base: 'USD',
      date: ecb.value.date || today(),
      timestamp: Date.now(),
      source: 'ecb',
      rates: await this.withCryptoAndMetals({ ...marketRates, ...ecb.value.rates, USD: 1.0 }),
    };
  }

  /**
   * Open-market mid-rates via the Open Exchange Rates API (open.er-api.com)
   */
  private static async fetchOpenMarketRates(sourceId: RateSourceId): Promise<ExchangeRateData> {
    const data = await fetchJson(OPEN_MARKET_URL);
    if (!data?.rates) throw new Error('Open market response has no rates');

    return {
      base: 'USD',
      date: data.time_last_update_unix ? new Date(data.time_last_update_unix * 1000).toISOString().split('T')[0] : today(),
      timestamp: Date.now(),
      source: sourceId,
      rates: await this.withCryptoAndMetals({ ...data.rates, USD: 1.0 }),
    };
  }

  /**
   * National Bank of Ukraine official rates.
   * Currencies the NBU does not publish are filled from open-market rates.
   */
  private static async fetchNBURates(): Promise<ExchangeRateData> {
    const [nbu, market] = await Promise.allSettled([fetchJson(NBU_URL), fetchJson(OPEN_MARKET_URL)]);
    if (nbu.status !== 'fulfilled') throw nbu.reason;
    const nbuRates = parseNBURates(nbu.value);
    const marketRates = market.status === 'fulfilled' ? market.value?.rates || {} : {};
    const nbuDate: string | undefined = Array.isArray(nbu.value) ? nbu.value[0]?.exchangedate : undefined;

    return {
      base: 'USD',
      // NBU dates are DD.MM.YYYY
      date: nbuDate ? nbuDate.split('.').reverse().join('-') : today(),
      timestamp: Date.now(),
      source: 'nbu',
      rates: await this.withCryptoAndMetals({ ...marketRates, ...nbuRates }),
    };
  }

  /**
   * Adds crypto (CoinGecko) and precious metal (gold-api.com) prices for any codes the source lacks.
   * Failures are ignored: those codes just stay unavailable.
   */
  private static async withCryptoAndMetals(rates: Record<string, number>): Promise<Record<string, number>> {
    if (!this.cryptoMetalsCache || Date.now() - this.cryptoMetalsCache.at > CACHE_TTL_MS) {
      const extra: Record<string, number> = {};
      const [crypto, ...metals] = await Promise.allSettled([
        fetchJson(COINGECKO_URL),
        ...METAL_CODES.map(code => fetchJson(METAL_PRICE_URL(code))),
      ]);

      if (crypto.status === 'fulfilled') {
        for (const [code, id] of Object.entries(COINGECKO_IDS)) {
          const usd = crypto.value?.[id]?.usd;
          if (typeof usd === 'number' && usd > 0) extra[code] = 1 / usd;
        }
      }
      metals.forEach((m, i) => {
        const usd = m.status === 'fulfilled' ? m.value?.price : undefined;
        if (typeof usd === 'number' && usd > 0) extra[METAL_CODES[i]] = 1 / usd;
      });

      // Only cache a useful result, so a failed lookup is retried next time
      if (Object.keys(extra).length > 0) {
        this.cryptoMetalsCache = { at: Date.now(), rates: extra };
      } else {
        return rates;
      }
    }
    return { ...this.cryptoMetalsCache.rates, ...rates };
  }

  /**
   * Markup (%) a source adds on top of the market mid-rate
   */
  public static getMarkupPct(sourceId: RateSourceId): number {
    if (sourceId === 'custom_bank') {
      try {
        const v = parseFloat(localStorage.getItem(CUSTOM_SPREAD_STORAGE_KEY) ?? '');
        return isFinite(v) && v >= 0 ? v : DEFAULT_CUSTOM_SPREAD_PCT;
      } catch {
        return DEFAULT_CUSTOM_SPREAD_PCT;
      }
    }
    return CARD_NETWORK_MARKUP_PCT[sourceId] ?? 0;
  }

  /**
   * Rate for 1 unit of fromCurrency in toCurrency, including the source's markup.
   * Returns NaN when either currency has no rate, so the UI can show it as unavailable.
   */
  public static calculateRate(
    fromCurrency: string,
    toCurrency: string,
    rateData: ExchangeRateData,
    includeMarkup: boolean = true
  ): number {
    if (fromCurrency === toCurrency) return 1.0;

    const fromPerUsd = rateData.rates[fromCurrency];
    const toPerUsd = rateData.rates[toCurrency];
    if (!(fromPerUsd > 0) || !(toPerUsd > 0)) {
      return NaN;
    }

    // Rates are stored as 1 USD = X currency
    const midRate = toPerUsd / fromPerUsd;
    return includeMarkup ? midRate * (1 + this.getMarkupPct(rateData.source) / 100) : midRate;
  }

  private static referenceCache = new Map<string, number | null>();

  /** Official rate (card currency per 1 purchase currency) on one day, or null if that source has none */
  private static async officialRateOn(source: 'nbu' | 'ecb', from: string, to: string, date: string): Promise<number | null> {
    const key = `${source}:${from}:${to}:${date}`;
    if (this.referenceCache.has(key)) return this.referenceCache.get(key)!;
    let rate: number | null = null;
    try {
      if (source === 'nbu') {
        const rates = parseNBURates(await fetchJson(`${NBU_URL}&date=${date.replace(/-/g, '')}`));
        rate = rates[from] > 0 && rates[to] > 0 ? rates[to] / rates[from] : null;
      } else {
        const data = await fetchJson(`${FRANKFURTER_BASE}/${date}?base=${from}&symbols=${to}`);
        const r = data?.rates?.[to];
        rate = typeof r === 'number' && r > 0 ? r : null;
      }
    } catch (e) {
      // Network errors aren't cached, so the next try asks again
      console.warn('Official rate unavailable', source, from, to, date, e);
      return null;
    }
    this.referenceCache.set(key, rate);
    return rate;
  }

  /**
   * Official rates for the given days, for checking what a card charged.
   * Uses the NBU when either currency is UAH (the rate Ukrainian banks quote against), otherwise the ECB,
   * and falls back to the other one when the first has no rate for the pair.
   * Returns null when neither source has the pair for the first date.
   */
  public static async getOfficialRates(
    from: string,
    to: string,
    dates: string[]
  ): Promise<{ source: 'nbu' | 'ecb'; rates: { date: string; rate: number }[] } | null> {
    if (dates.length === 0 || from === to || NON_FIAT_CODES.includes(from) || NON_FIAT_CODES.includes(to)) return null;
    const order: ('nbu' | 'ecb')[] = from === 'UAH' || to === 'UAH' ? ['nbu', 'ecb'] : ['ecb', 'nbu'];
    for (const source of order) {
      const found = await Promise.all(dates.map(d => this.officialRateOn(source, from, to, d)));
      if (found[0] === null) continue;
      const rates = dates
        .map((date, i) => ({ date, rate: found[i] }))
        .filter((r): r is { date: string; rate: number } => r.rate !== null);
      return { source, rates };
    }
    return null;
  }

  /**
   * Historical rates from the Frankfurter (ECB) API.
   * Returns null when no history is available for the pair (e.g. UAH, crypto, metals),
   * rather than making up a series.
   */
  public static async getHistoricalRates(
    fromCurrency: string,
    toCurrency: string,
    timeframe: '7d' | '1m' | '3m' | '1y' | '5y'
  ): Promise<HistoricalDataSummary | null> {
    if (fromCurrency === toCurrency || NON_FIAT_CODES.includes(fromCurrency) || NON_FIAT_CODES.includes(toCurrency)) {
      return null;
    }

    const daysMap = { '7d': 7, '1m': 30, '3m': 90, '1y': 365, '5y': 1825 };
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysMap[timeframe]);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    let points: HistoricalRatePoint[] = [];
    try {
      const data = await fetchJson(`${FRANKFURTER_BASE}/${startStr}..${endStr}?base=${fromCurrency}&symbols=${toCurrency}`);
      points = Object.entries(data?.rates || {})
        .map(([date, rateObj]: [string, any]) => ({ date, rate: rateObj?.[toCurrency] }))
        .filter((p): p is HistoricalRatePoint => typeof p.rate === 'number' && p.rate > 0)
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (e) {
      console.warn('Historical rates unavailable for', fromCurrency, toCurrency, e);
      return null;
    }
    if (points.length === 0) return null;

    const currentRate = points[points.length - 1].rate;
    const startRate = points[0].rate;
    const allRates = points.map(p => p.rate);
    const changeValue = currentRate - startRate;

    return {
      fromCurrency,
      toCurrency,
      timeframe,
      dataPoints: points,
      currentRate,
      high: Math.max(...allRates),
      low: Math.min(...allRates),
      average: allRates.reduce((a, b) => a + b, 0) / allRates.length,
      changePercentage: (changeValue / startRate) * 100,
      changeValue,
    };
  }
}
