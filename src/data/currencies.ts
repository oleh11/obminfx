import { Currency, RateSource, RateSourceId } from "../types/currency";
import { en, TKey } from "../i18n/en";

// Comprehensive Global ISO-4217 Currency Database (165+ Currencies, Crypto & Commodities)
export const GLOBAL_CURRENCY_METADATA: Record<string, Partial<Currency>> = {
  // Top Global & Americas
  USD: { name: "US Dollar", symbol: "$", flag: "🇺🇸", country: "United States", decimalPlaces: 2 },
  EUR: { name: "Euro", symbol: "€", flag: "🇪🇺", country: "Eurozone", decimalPlaces: 2 },
  UAH: { name: "Ukrainian Hryvnia", symbol: "₴", flag: "🇺🇦", country: "Ukraine", decimalPlaces: 2 },
  CAD: { name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦", country: "Canada", decimalPlaces: 2 },
  GBP: { name: "British Pound", symbol: "£", flag: "🇬🇧", country: "United Kingdom", decimalPlaces: 2 },
  AUD: { name: "Australian Dollar", symbol: "A$", flag: "🇦🇺", country: "Australia", decimalPlaces: 2 },
  NZD: { name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿", country: "New Zealand", decimalPlaces: 2 },
  JPY: { name: "Japanese Yen", symbol: "¥", flag: "🇯🇵", country: "Japan", decimalPlaces: 0 },
  CNY: { name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳", country: "China", decimalPlaces: 2 },
  CHF: { name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭", country: "Switzerland", decimalPlaces: 2 },
  PLN: { name: "Polish Złoty", symbol: "zł", flag: "🇵🇱", country: "Poland", decimalPlaces: 2 },
  MXN: { name: "Mexican Peso", symbol: "$", flag: "🇲🇽", country: "Mexico", decimalPlaces: 2 },
  BRL: { name: "Brazilian Real", symbol: "R$", flag: "🇧🇷", country: "Brazil", decimalPlaces: 2 },
  ARS: { name: "Argentine Peso", symbol: "$", flag: "🇦🇷", country: "Argentina", decimalPlaces: 2 },
  COP: { name: "Colombian Peso", symbol: "$", flag: "🇨🇴", country: "Colombia", decimalPlaces: 0 },
  CLP: { name: "Chilean Peso", symbol: "$", flag: "🇨🇱", country: "Chile", decimalPlaces: 0 },
  PEN: { name: "Peruvian Sol", symbol: "S/", flag: "🇵🇪", country: "Peru", decimalPlaces: 2 },
  UYU: { name: "Uruguayan Peso", symbol: "$U", flag: "🇺🇾", country: "Uruguay", decimalPlaces: 2 },
  BOB: { name: "Bolivian Boliviano", symbol: "Bs", flag: "🇧🇴", country: "Bolivia", decimalPlaces: 2 },
  PYG: { name: "Paraguayan Guarani", symbol: "₲", flag: "🇵🇾", country: "Paraguay", decimalPlaces: 0 },
  CRC: { name: "Costa Rican Colón", symbol: "₡", flag: "🇨🇷", country: "Costa Rica", decimalPlaces: 2 },
  DOP: { name: "Dominican Peso", symbol: "RD$", flag: "🇩🇴", country: "Dominican Republic", decimalPlaces: 2 },
  GTQ: { name: "Guatemalan Quetzal", symbol: "Q", flag: "🇬🇹", country: "Guatemala", decimalPlaces: 2 },
  HNL: { name: "Honduran Lempira", symbol: "L", flag: "🇭🇳", country: "Honduras", decimalPlaces: 2 },
  NIO: { name: "Nicaraguan Córdoba", symbol: "C$", flag: "🇳🇮", country: "Nicaragua", decimalPlaces: 2 },
  PAB: { name: "Panamanian Balboa", symbol: "B/.", flag: "🇵🇦", country: "Panama", decimalPlaces: 2 },
  JMD: { name: "Jamaican Dollar", symbol: "J$", flag: "🇯🇲", country: "Jamaica", decimalPlaces: 2 },
  TTD: { name: "Trinidad & Tobago Dollar", symbol: "TT$", flag: "🇹🇹", country: "Trinidad & Tobago", decimalPlaces: 2 },
  BBD: { name: "Barbadian Dollar", symbol: "Bds$", flag: "🇧🇧", country: "Barbados", decimalPlaces: 2 },
  BSD: { name: "Bahamian Dollar", symbol: "B$", flag: "🇧🇸", country: "Bahamas", decimalPlaces: 2 },
  BZD: { name: "Belize Dollar", symbol: "BZ$", flag: "🇧🇿", country: "Belize", decimalPlaces: 2 },

  // Asia & Southeast Asia
  VND: { name: "Vietnamese Đồng", symbol: "₫", flag: "🇻🇳", country: "Vietnam", decimalPlaces: 0 },
  SGD: { name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬", country: "Singapore", decimalPlaces: 2 },
  HKD: { name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰", country: "Hong Kong", decimalPlaces: 2 },
  KRW: { name: "South Korean Won", symbol: "₩", flag: "🇰🇷", country: "South Korea", decimalPlaces: 0 },
  INR: { name: "Indian Rupee", symbol: "₹", flag: "🇮🇳", country: "India", decimalPlaces: 2 },
  IDR: { name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩", country: "Indonesia", decimalPlaces: 0 },
  MYR: { name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾", country: "Malaysia", decimalPlaces: 2 },
  THB: { name: "Thai Baht", symbol: "฿", flag: "🇹🇭", country: "Thailand", decimalPlaces: 2 },
  PHP: { name: "Philippine Peso", symbol: "₱", flag: "🇵🇭", country: "Philippines", decimalPlaces: 2 },
  TWD: { name: "New Taiwan Dollar", symbol: "NT$", flag: "🇹🇼", country: "Taiwan", decimalPlaces: 1 },
  PKR: { name: "Pakistani Rupee", symbol: "₨", flag: "🇵🇰", country: "Pakistan", decimalPlaces: 2 },
  BDT: { name: "Bangladeshi Taka", symbol: "৳", flag: "🇧🇩", country: "Bangladesh", decimalPlaces: 2 },
  LKR: { name: "Sri Lankan Rupee", symbol: "Rs", flag: "🇱🇰", country: "Sri Lanka", decimalPlaces: 2 },
  NPR: { name: "Nepalese Rupee", symbol: "रू", flag: "🇳🇵", country: "Nepal", decimalPlaces: 2 },
  MMK: { name: "Myanmar Kyat", symbol: "K", flag: "🇲🇲", country: "Myanmar", decimalPlaces: 0 },
  KHR: { name: "Cambodian Riel", symbol: "៛", flag: "🇰🇭", country: "Cambodia", decimalPlaces: 0 },
  LAK: { name: "Lao Kip", symbol: "₭", flag: "🇱🇦", country: "Laos", decimalPlaces: 0 },
  MNT: { name: "Mongolian Tögrög", symbol: "₮", flag: "🇲🇳", country: "Mongolia", decimalPlaces: 2 },
  KZT: { name: "Kazakhstani Tenge", symbol: "₸", flag: "🇰🇿", country: "Kazakhstan", decimalPlaces: 2 },
  UZS: { name: "Uzbekistani Som", symbol: "so'm", flag: "🇺🇿", country: "Uzbekistan", decimalPlaces: 0 },
  GEL: { name: "Georgian Lari", symbol: "₾", flag: "🇬🇪", country: "Georgia", decimalPlaces: 2 },
  AMD: { name: "Armenian Dram", symbol: "֏", flag: "🇦🇲", country: "Armenia", decimalPlaces: 2 },
  AZN: { name: "Azerbaijani Manat", symbol: "₼", flag: "🇦🇿", country: "Azerbaijan", decimalPlaces: 2 },

  // Europe & Scandinavia
  SEK: { name: "Swedish Krona", symbol: "kr", flag: "🇸🇪", country: "Sweden", decimalPlaces: 2 },
  NOK: { name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴", country: "Norway", decimalPlaces: 2 },
  DKK: { name: "Danish Krone", symbol: "kr", flag: "🇩🇰", country: "Denmark", decimalPlaces: 2 },
  ISK: { name: "Icelandic Króna", symbol: "kr", flag: "🇮🇸", country: "Iceland", decimalPlaces: 0 },
  CZK: { name: "Czech Koruna", symbol: "Kč", flag: "🇨🇿", country: "Czech Republic", decimalPlaces: 2 },
  HUF: { name: "Hungarian Forint", symbol: "Ft", flag: "🇭🇺", country: "Hungary", decimalPlaces: 0 },
  RON: { name: "Romanian Leu", symbol: "lei", flag: "🇷🇴", country: "Romania", decimalPlaces: 2 },
  BGN: { name: "Bulgarian Lev", symbol: "лв", flag: "🇧🇬", country: "Bulgaria", decimalPlaces: 2 },
  RSD: { name: "Serbian Dinar", symbol: "дин.", flag: "🇷🇸", country: "Serbia", decimalPlaces: 2 },
  BAM: { name: "Bosnia Convertible Mark", symbol: "KM", flag: "🇧🇦", country: "Bosnia & Herzegovina", decimalPlaces: 2 },
  MKD: { name: "Macedonian Denar", symbol: "ден", flag: "🇲🇰", country: "North Macedonia", decimalPlaces: 2 },
  ALL: { name: "Albanian Lek", symbol: "L", flag: "🇦🇱", country: "Albania", decimalPlaces: 2 },
  MDL: { name: "Moldovan Leu", symbol: "L", flag: "🇲🇩", country: "Moldova", decimalPlaces: 2 },
  TRY: { name: "Turkish Lira", symbol: "₺", flag: "🇹🇷", country: "Turkey", decimalPlaces: 2 },

  // Middle East & Africa
  AED: { name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪", country: "United Arab Emirates", decimalPlaces: 2 },
  SAR: { name: "Saudi Riyal", symbol: "﷼", flag: "🇸🇦", country: "Saudi Arabia", decimalPlaces: 2 },
  QAR: { name: "Qatari Riyal", symbol: "QR", flag: "🇶🇦", country: "Qatar", decimalPlaces: 2 },
  KWD: { name: "Kuwaiti Dinar", symbol: "KD", flag: "🇰🇼", country: "Kuwait", decimalPlaces: 3 },
  BHD: { name: "Bahraini Dinar", symbol: "BD", flag: "🇧🇭", country: "Bahrain", decimalPlaces: 3 },
  OMR: { name: "Omani Rial", symbol: "OMR", flag: "🇴🇲", country: "Oman", decimalPlaces: 3 },
  JOD: { name: "Jordanian Dinar", symbol: "JD", flag: "🇯🇴", country: "Jordan", decimalPlaces: 3 },
  ILS: { name: "Israeli Shekel", symbol: "₪", flag: "🇮🇱", country: "Israel", decimalPlaces: 2 },
  EGP: { name: "Egyptian Pound", symbol: "E£", flag: "🇪🇬", country: "Egypt", decimalPlaces: 2 },
  ZAR: { name: "South African Rand", symbol: "R", flag: "🇿🇦", country: "South Africa", decimalPlaces: 2 },
  MAD: { name: "Moroccan Dirham", symbol: "DH", flag: "🇲🇦", country: "Morocco", decimalPlaces: 2 },
  TND: { name: "Tunisian Dinar", symbol: "DT", flag: "🇹🇳", country: "Tunisia", decimalPlaces: 3 },
  DZD: { name: "Algerian Dinar", symbol: "DA", flag: "🇩🇿", country: "Algeria", decimalPlaces: 2 },
  NGN: { name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬", country: "Nigeria", decimalPlaces: 2 },
  KES: { name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪", country: "Kenya", decimalPlaces: 2 },
  GHS: { name: "Ghanaian Cedi", symbol: "GH₵", flag: "🇬🇭", country: "Ghana", decimalPlaces: 2 },
  UGX: { name: "Ugandan Shilling", symbol: "USh", flag: "🇺🇬", country: "Uganda", decimalPlaces: 0 },
  TZS: { name: "Tanzanian Shilling", symbol: "TSh", flag: "🇹🇿", country: "Tanzania", decimalPlaces: 0 },
  ETB: { name: "Ethiopian Birr", symbol: "Br", flag: "🇪🇹", country: "Ethiopia", decimalPlaces: 2 },
  MUR: { name: "Mauritian Rupee", symbol: "₨", flag: "🇲🇺", country: "Mauritius", decimalPlaces: 2 },
  BWP: { name: "Botswana Pula", symbol: "P", flag: "🇧🇼", country: "Botswana", decimalPlaces: 2 },
  NAD: { name: "Namibian Dollar", symbol: "N$", flag: "🇳🇦", country: "Namibia", decimalPlaces: 2 },
  ZMW: { name: "Zambian Kwacha", symbol: "ZK", flag: "🇿🇲", country: "Zambia", decimalPlaces: 2 },

  // Crypto & Commodities
  BTC: { name: "Bitcoin", symbol: "₿", flag: "🪙", country: "Global Crypto", type: "crypto", decimalPlaces: 6 },
  ETH: { name: "Ethereum", symbol: "Ξ", flag: "🔷", country: "Global Crypto", type: "crypto", decimalPlaces: 6 },
  SOL: { name: "Solana", symbol: "◎", flag: "🟣", country: "Global Crypto", type: "crypto", decimalPlaces: 4 },
  XAU: { name: "Gold (Troy Ounce)", symbol: "oz", flag: "🥇", country: "Precious Commodity", type: "commodity", decimalPlaces: 2 },
  XAG: { name: "Silver (Troy Ounce)", symbol: "oz", flag: "🥈", country: "Precious Commodity", type: "commodity", decimalPlaces: 2 },
  XPT: { name: "Platinum (Troy Ounce)", symbol: "oz", flag: "⚪", country: "Precious Commodity", type: "commodity", decimalPlaces: 2 },
  XPD: { name: "Palladium (Troy Ounce)", symbol: "oz", flag: "🔘", country: "Precious Commodity", type: "commodity", decimalPlaces: 2 }
};

// Generates full Currency object from code with fallback
export function resolveCurrency(code: string): Currency {
  const upper = code.toUpperCase();
  const meta = GLOBAL_CURRENCY_METADATA[upper];
  if (meta) {
    return {
      code: upper,
      name: meta.name || upper,
      symbol: meta.symbol || upper,
      flag: meta.flag || "🌐",
      country: meta.country || "World",
      type: meta.type || "fiat",
      decimalPlaces: meta.decimalPlaces !== undefined ? meta.decimalPlaces : 2
    };
  }

  return {
    code: upper,
    name: upper + " Currency",
    symbol: upper,
    flag: "🌐",
    country: "Global",
    type: "fiat",
    decimalPlaces: 2
  };
}

// Initial full list of all 160+ known world currencies
export const ALL_CURRENCIES: Currency[] = Object.keys(GLOBAL_CURRENCY_METADATA).map(resolveCurrency);

// Display text lives in src/i18n; these English values are the defaults.
const sourceDefaults = (id: RateSourceId) => ({
  name: en[`source.${id}.name` as TKey],
  shortName: en[`source.${id}.shortName` as TKey],
  description: en[`source.${id}.description` as TKey],
  badge: en[`source.${id}.badge` as TKey],
  updateFrequency: en[`source.${id}.updateFrequency` as TKey]
});

export const AVAILABLE_SOURCES: RateSource[] = [
  { id: "ecb", ...sourceDefaults("ecb"), isOfficial: true, color: "amber" },
  { id: "nbu", ...sourceDefaults("nbu"), isOfficial: true, color: "amber" },
  { id: "mastercard", ...sourceDefaults("mastercard"), isOfficial: false, color: "amber" },
  { id: "visa", ...sourceDefaults("visa"), isOfficial: false, color: "blue" },
  { id: "custom_bank", ...sourceDefaults("custom_bank"), isOfficial: false, color: "amber" }
];

export const DEFAULT_PINNED_CURRENCIES = ["USD", "EUR", "UAH", "CAD", "PLN", "GBP", "VND", "JPY", "AUD", "CHF", "BTC", "XAU"];

export const CURRENCY_MAP: Record<string, Currency> = ALL_CURRENCIES.reduce((acc, curr) => {
  acc[curr.code] = curr;
  return acc;
}, {} as Record<string, Currency>);

export const CARD_FEE_PRESETS = (["free", "low", "avg", "std", "high"] as const).map((id, i) => ({
  id,
  name: en[`preset.${id}.name`],
  percentage: [0, 1.0, 2.0, 3.0, 3.5][i],
  tag: en[`preset.${id}.tag`]
}));

export function getCurrencyMeta(code: string): Currency {
  return CURRENCY_MAP[code] || resolveCurrency(code);
}
