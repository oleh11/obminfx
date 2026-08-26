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

// Added Currencylayer and National Bank of Ukraine (NBU) as new RateSourceIds
export type RateSourceId = 'ecb' | 'open_market' | 'mastercard' | 'crypto_metals' | 'custom_bank' | 'currencylayer' | 'nbu';

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
