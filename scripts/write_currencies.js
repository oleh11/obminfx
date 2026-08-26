const fs = require('fs');

const currenciesContent = `import { Currency, RateSource } from '../types/currency';

export const ALL_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', type: 'fiat', country: 'United States', decimalPlaces: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', type: 'fiat', country: 'Eurozone', decimalPlaces: 2 },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', flag: '🇺🇦', type: 'fiat', country: 'Ukraine', decimalPlaces: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', type: 'fiat', country: 'United Kingdom', decimalPlaces: 2 },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', flag: '🇵🇱', type: 'fiat', country: 'Poland', decimalPlaces: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', type: 'fiat', country: 'Canada', decimalPlaces: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', type: 'fiat', country: 'Australia', decimalPlaces: 2 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', type: 'fiat', country: 'Switzerland', decimalPlaces: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', type: 'fiat', country: 'Japan', decimalPlaces: 0 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', type: 'fiat', country: 'China', decimalPlaces: 2 },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿', type: 'fiat', country: 'Czech Republic', decimalPlaces: 2 },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', type: 'fiat', country: 'Sweden', decimalPlaces: 2 },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', type: 'fiat', country: 'Norway', decimalPlaces: 2 },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', type: 'fiat', country: 'Denmark', decimalPlaces: 2 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', type: 'fiat', country: 'Turkey', decimalPlaces: 2 },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱', type: 'fiat', country: 'Israel', decimalPlaces: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', type: 'fiat', country: 'India', decimalPlaces: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', type: 'fiat', country: 'Brazil', decimalPlaces: 2 },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', type: 'fiat', country: 'Mexico', decimalPlaces: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', type: 'fiat', country: 'Singapore', decimalPlaces: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', type: 'fiat', country: 'Hong Kong', decimalPlaces: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', type: 'fiat', country: 'New Zealand', decimalPlaces: 2 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', type: 'fiat', country: 'South Korea', decimalPlaces: 0 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', type: 'fiat', country: 'United Arab Emirates', decimalPlaces: 2 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', type: 'fiat', country: 'Saudi Arabia', decimalPlaces: 2 },
  { code: 'BTC', name: 'Bitcoin', symbol: '₿', flag: '🪙', type: 'crypto', country: 'Global Crypto', decimalPlaces: 6 },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', flag: '🔷', type: 'crypto', country: 'Global Crypto', decimalPlaces: 6 },
  { code: 'XAU', name: 'Gold (Troy Ounce)', symbol: 'oz', flag: '🥇', type: 'commodity', country: 'Commodity', decimalPlaces: 2 },
  { code: 'XAG', name: 'Silver (Troy Ounce)', symbol: 'oz', flag: '🥈', type: 'commodity', country: 'Commodity', decimalPlaces: 2 }
];

export const AVAILABLE_SOURCES: RateSource[] = [
  {
    id: 'ecb',
    name: 'European Central Bank (ECB)',
    shortName: 'ECB Daily',
    description: 'Official benchmark rates published daily by the European Central Bank. Highly reliable benchmark for international trade.',
    badge: 'Official Benchmark',
    updateFrequency: 'Daily (16:00 CET)',
    isOfficial: true,
    color: 'emerald'
  },
  {
    id: 'nbu',
    name: 'National Bank of Ukraine (NBU)',
    shortName: 'NBU Official',
    description: 'Official reference exchange rates published by the National Bank of Ukraine. Primary benchmark for UAH settlements.',
    badge: 'Ukrainian Official',
    updateFrequency: 'Daily (09:00 UHT)',
    isOfficial: true,
    color: 'amber'
  },
  {
    id: 'mastercard',
    name: 'Mastercard FX Benchmark',
    shortName: 'Mastercard FX',
    description: 'Simulates official Mastercard settlement exchange rates with wholesale card network spreads for cross-border transactions.',
    badge: 'Card Network Rate',
    updateFrequency: 'Daily Network Fixing',
    isOfficial: true,
    color: 'purple'
  },
  {
    id: 'currencylayer',
    name: 'Currencylayer Real-Time',
    shortName: 'Currencylayer',
    description: 'Real-time global market rates with broad API coverage for fiat, crypto, and precious metals.',
    badge: 'Global Real-Time',
    updateFrequency: 'Minute-level updates',
    isOfficial: false,
    color: 'sky'
  },
  {
    id: 'custom_bank',
    name: 'Custom Bank / Issuer Spread',
    shortName: 'Custom Bank',
    description: 'User-configured custom exchange rate with customizable foreign currency spread markup for specific bank cards.',
    badge: 'User Defined',
    updateFrequency: 'Manual / Dynamic',
    isOfficial: false,
    color: 'cyan'
  }
];

export const DEFAULT_PINNED_CURRENCIES = ['USD', 'EUR', 'UAH', 'GBP', 'PLN', 'CAD', 'CHF', 'JPY', 'BTC', 'XAU'];

export const CURRENCY_MAP: Record<string, Currency> = ALL_CURRENCIES.reduce((acc, curr) => {
  acc[curr.code] = curr;
  return acc;
}, {} as Record<string, Currency>);

export const CARD_FEE_PRESETS = [
  { id: 'free', name: '0% No-Fee Travel Card', percentage: 0, tag: 'Best Travel' },
  { id: 'low', name: '1.0% Low Spread Card', percentage: 1.0, tag: 'Low Fee' },
  { id: 'avg', name: '2.0% Average Bank Fee', percentage: 2.0, tag: 'Bank Average' },
  { id: 'std', name: '3.0% Standard Credit Card', percentage: 3.0, tag: 'Typical' },
  { id: 'high', name: '3.5% International Card', percentage: 3.5, tag: 'High Markup' }
];

export function getCurrencyMeta(code: string): Currency {
  return ALL_CURRENCIES.find(c => c.code === code) || {
    code: code || 'USD',
    name: code || 'Currency',
    symbol: code || '$',
    flag: '🌐',
    type: 'fiat',
    country: 'Global',
    decimalPlaces: 2
  };
}
`;

fs.writeFileSync('src/data/currencies.ts', currenciesContent, 'utf8');
console.log('currencies.ts written successfully');
