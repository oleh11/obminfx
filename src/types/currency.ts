export type CurrencyType = 'fiat' | 'crypto' | 'commodity';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  country: string;
  type: CurrencyType;
  decimalPlaces: number;
}

export type RateSourceId = 'ecb' | 'open_market' | 'mastercard' | 'visa' | 'custom_bank' | 'nbu';

export interface RateSource {
  id: RateSourceId;
  name: string;
  shortName: string;
  description: string;
  badge: string;
  updateFrequency: string;
  isOfficial: boolean;
  color: string;
}

export interface ExchangeRateData {
  base: string;
  date: string;
  timestamp: number;
  source: RateSourceId;
  rates: Record<string, number>;
  /** True when no live source answered and the built-in offline rates are shown. */
  isFallback?: boolean;
}

export interface HistoricalRatePoint {
  date: string;
  rate: number;
}

export interface HistoricalDataSummary {
  fromCurrency: string;
  toCurrency: string;
  timeframe: '7d' | '1m' | '3m' | '1y' | '5y';
  dataPoints: HistoricalRatePoint[];
  currentRate: number;
  high: number;
  low: number;
  average: number;
  changePercentage: number;
  changeValue: number;
}

export interface BankFeeConfig {
  feePercentage: number;
  customSpreadBps?: number;
}

export interface FeeCalculationResult {
  originalAmount: number;
  fromCurrency: string;
  toCurrency: string;
  baseRate: number;
  convertedBaseAmount: number;
  bankFeePercentage: number;
  bankFeeAmount: number;
  totalBilledAmount: number;
  effectiveRate: number;
  reverseEffectiveRate: number;
  savingsVsTypicalCard: number; // compared to standard 3% bank markup
  costVsZeroFeeCard: number;
}
