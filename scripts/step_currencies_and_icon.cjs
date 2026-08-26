const fs = require('fs');

// 1. ALL_CURRENCIES (Expanded to 45+ world currencies)
const currenciesContent = [
  'import { Currency, RateSource } from "../types/currency";',
  '',
  'export const ALL_CURRENCIES: Currency[] = [',
  '  // Americas',
  '  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", type: "fiat", country: "United States", decimalPlaces: 2 },',
  '  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦", type: "fiat", country: "Canada", decimalPlaces: 2 },',
  '  { code: "MXN", name: "Mexican Peso", symbol: "$", flag: "🇲🇽", type: "fiat", country: "Mexico", decimalPlaces: 2 },',
  '  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷", type: "fiat", country: "Brazil", decimalPlaces: 2 },',
  '  { code: "ARS", name: "Argentine Peso", symbol: "$", flag: "🇦🇷", type: "fiat", country: "Argentina", decimalPlaces: 2 },',
  '  { code: "COP", name: "Colombian Peso", symbol: "$", flag: "🇨🇴", type: "fiat", country: "Colombia", decimalPlaces: 0 },',
  '  { code: "CLP", name: "Chilean Peso", symbol: "$", flag: "🇨🇱", type: "fiat", country: "Chile", decimalPlaces: 0 },',
  '  { code: "PEN", name: "Peruvian Sol", symbol: "S/", flag: "🇵🇪", type: "fiat", country: "Peru", decimalPlaces: 2 },',
  '',
  '  // Europe & Central Europe',
  '  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", type: "fiat", country: "Eurozone", decimalPlaces: 2 },',
  '  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", flag: "🇺🇦", type: "fiat", country: "Ukraine", decimalPlaces: 2 },',
  '  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", type: "fiat", country: "United Kingdom", decimalPlaces: 2 },',
  '  { code: "PLN", name: "Polish Złoty", symbol: "zł", flag: "🇵🇱", type: "fiat", country: "Poland", decimalPlaces: 2 },',
  '  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭", type: "fiat", country: "Switzerland", decimalPlaces: 2 },',
  '  { code: "CZK", name: "Czech Koruna", symbol: "Kč", flag: "🇨🇿", type: "fiat", country: "Czech Republic", decimalPlaces: 2 },',
  '  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", flag: "🇭🇺", type: "fiat", country: "Hungary", decimalPlaces: 0 },',
  '  { code: "RON", name: "Romanian Leu", symbol: "lei", flag: "🇷🇴", type: "fiat", country: "Romania", decimalPlaces: 2 },',
  '  { code: "BGN", name: "Bulgarian Lev", symbol: "лв", flag: "🇧🇬", type: "fiat", country: "Bulgaria", decimalPlaces: 2 },',
  '  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪", type: "fiat", country: "Sweden", decimalPlaces: 2 },',
  '  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴", type: "fiat", country: "Norway", decimalPlaces: 2 },',
  '  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰", type: "fiat", country: "Denmark", decimalPlaces: 2 },',
  '  { code: "ISK", name: "Icelandic Króna", symbol: "kr", flag: "🇮🇸", type: "fiat", country: "Iceland", decimalPlaces: 0 },',
  '  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷", type: "fiat", country: "Turkey", decimalPlaces: 2 },',
  '',
  '  // Asia & Pacific',
  '  { code: "VND", name: "Vietnamese Đồng", symbol: "₫", flag: "🇻🇳", type: "fiat", country: "Vietnam", decimalPlaces: 0 },',
  '  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵", type: "fiat", country: "Japan", decimalPlaces: 0 },',
  '  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳", type: "fiat", country: "China", decimalPlaces: 2 },',
  '  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷", type: "fiat", country: "South Korea", decimalPlaces: 0 },',
  '  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳", type: "fiat", country: "India", decimalPlaces: 2 },',
  '  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬", type: "fiat", country: "Singapore", decimalPlaces: 2 },',
  '  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰", type: "fiat", country: "Hong Kong", decimalPlaces: 2 },',
  '  { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$", flag: "🇹🇼", type: "fiat", country: "Taiwan", decimalPlaces: 1 },',
  '  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭", type: "fiat", country: "Thailand", decimalPlaces: 2 },',
  '  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾", type: "fiat", country: "Malaysia", decimalPlaces: 2 },',
  '  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩", type: "fiat", country: "Indonesia", decimalPlaces: 0 },',
  '  { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭", type: "fiat", country: "Philippines", decimalPlaces: 2 },',
  '  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺", type: "fiat", country: "Australia", decimalPlaces: 2 },',
  '  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿", type: "fiat", country: "New Zealand", decimalPlaces: 2 },',
  '',
  '  // Middle East & Africa',
  '  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪", type: "fiat", country: "United Arab Emirates", decimalPlaces: 2 },',
  '  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", flag: "🇸🇦", type: "fiat", country: "Saudi Arabia", decimalPlaces: 2 },',
  '  { code: "QAR", name: "Qatari Riyal", symbol: "QR", flag: "🇶🇦", type: "fiat", country: "Qatar", decimalPlaces: 2 },',
  '  { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD", flag: "🇰🇼", type: "fiat", country: "Kuwait", decimalPlaces: 3 },',
  '  { code: "ILS", name: "Israeli Shekel", symbol: "₪", flag: "🇮🇱", type: "fiat", country: "Israel", decimalPlaces: 2 },',
  '  { code: "EGP", name: "Egyptian Pound", symbol: "E£", flag: "🇪🇬", type: "fiat", country: "Egypt", decimalPlaces: 2 },',
  '  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦", type: "fiat", country: "South Africa", decimalPlaces: 2 },',
  '',
  '  // Crypto & Precious Commodities',
  '  { code: "BTC", name: "Bitcoin", symbol: "₿", flag: "🪙", type: "crypto", country: "Global Crypto", decimalPlaces: 6 },',
  '  { code: "ETH", name: "Ethereum", symbol: "Ξ", flag: "🔷", type: "crypto", country: "Global Crypto", decimalPlaces: 6 },',
  '  { code: "XAU", name: "Gold (Troy Ounce)", symbol: "oz", flag: "🥇", type: "commodity", country: "Commodity", decimalPlaces: 2 },',
  '  { code: "XAG", name: "Silver (Troy Ounce)", symbol: "oz", flag: "🥈", type: "commodity", country: "Commodity", decimalPlaces: 2 }',
  '];',
  '',
  'export const AVAILABLE_SOURCES: RateSource[] = [',
  '  {',
  '    id: "ecb",',
  '    name: "European Central Bank (ECB)",',
  '    shortName: "ECB Daily",',
  '    description: "Official benchmark rates published daily by the European Central Bank. Highly reliable benchmark for international trade.",',
  '    badge: "Official Benchmark",',
  '    updateFrequency: "Daily (16:00 CET)",',
  '    isOfficial: true,',
  '    color: "amber"',
  '  },',
  '  {',
  '    id: "nbu",',
  '    name: "National Bank of Ukraine (NBU)",',
  '    shortName: "NBU Official",',
  '    description: "Official reference exchange rates published by the National Bank of Ukraine. Primary benchmark for UAH settlements.",',
  '    badge: "Ukrainian Official",',
  '    updateFrequency: "Daily (09:00 UHT)",',
  '    isOfficial: true,',
  '    color: "amber"',
  '  },',
  '  {',
  '    id: "mastercard",',
  '    name: "Mastercard FX Benchmark",',
  '    shortName: "Mastercard FX",',
  '    description: "Simulates official Mastercard settlement exchange rates with wholesale card network spreads for cross-border transactions.",',
  '    badge: "Card Network Rate",',
  '    updateFrequency: "Daily Network Fixing",',
  '    isOfficial: true,',
  '    color: "amber"',
  '  },',
  '  {',
  '    id: "currencylayer",',
  '    name: "Currencylayer Real-Time",',
  '    shortName: "Currencylayer",',
  '    description: "Real-time global market rates with broad API coverage for fiat, crypto, and precious metals.",',
  '    badge: "Global Real-Time",',
  '    updateFrequency: "Minute-level updates",',
  '    isOfficial: false,',
  '    color: "amber"',
  '  },',
  '  {',
  '    id: "custom_bank",',
  '    name: "Custom Bank / Issuer Spread",',
  '    shortName: "Custom Bank",',
  '    description: "User-configured custom exchange rate with customizable foreign currency spread markup for specific bank cards.",',
  '    badge: "User Defined",',
  '    updateFrequency: "Manual / Dynamic",',
  '    isOfficial: false,',
  '    color: "amber"',
  '  }',
  '];',
  '',
  'export const DEFAULT_PINNED_CURRENCIES = ["USD", "EUR", "UAH", "CAD", "PLN", "GBP", "VND", "JPY", "AUD", "CHF", "BTC", "XAU"];',
  '',
  'export const CURRENCY_MAP: Record<string, Currency> = ALL_CURRENCIES.reduce((acc, curr) => {',
  '  acc[curr.code] = curr;',
  '  return acc;',
  '}, {} as Record<string, Currency>);',
  '',
  'export const CARD_FEE_PRESETS = [',
  '  { id: "free", name: "0% No-Fee Travel Card", percentage: 0, tag: "Best Travel" },',
  '  { id: "low", name: "1.0% Low Spread Card", percentage: 1.0, tag: "Low Fee" },',
  '  { id: "avg", name: "2.0% Average Bank Fee", percentage: 2.0, tag: "Bank Average" },',
  '  { id: "std", name: "3.0% Standard Credit Card", percentage: 3.0, tag: "Typical" },',
  '  { id: "high", name: "3.5% International Card", percentage: 3.5, tag: "High Markup" }',
  '];',
  '',
  'export function getCurrencyMeta(code: string): Currency {',
  '  return CURRENCY_MAP[code] || {',
  '    code,',
  '    name: code,',
  '    symbol: code,',
  '    flag: "🌐",',
  '    type: "fiat",',
  '    country: "World",',
  '    decimalPlaces: 2',
  '  };',
  '}'
].join('\n');
fs.writeFileSync('src/data/currencies.ts', currenciesContent, 'utf8');

// 2. Android Vector Icons - Warm Sun Gold / Honey Amber Icon with Charcoal Matte background
const bgXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <!-- Premium Matte Charcoal & Deep Dark Honey Surface -->
    <path
        android:fillColor="#141416"
        android:pathData="M0,0h108v108h-108z" />
    
    <!-- Warm Ambient Radial Glow -->
    <path
        android:fillColor="#221E18"
        android:pathData="M54,54m-42,0a42,42 0 1,1 84,0a42,42 0 1,1 -84,0" />

    <path
        android:fillColor="#382E1B"
        android:pathData="M54,54m-30,0a30,30 0 1,1 60,0a30,30 0 1,1 -60,0" />
</vector>
`;
fs.writeFileSync('android/app/src/main/res/drawable/ic_launcher_background.xml', bgXml, 'utf8');

// Foreground icon with Bold Ukrainian Sun Gold ₴ + Gold Exchange Arrows
const fgXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    
    <!-- Rich Golden Squircle Base Plate -->
    <path
        android:fillColor="#D97706"
        android:pathData="M54,24 C70,24 82,36 82,52 C82,68 70,80 54,80 C38,80 26,68 26,52 C26,36 38,24 54,24 Z" />

    <path
        android:fillColor="#F59E0B"
        android:pathData="M54,26 C68,26 80,38 80,52 C80,66 68,78 54,78 C40,78 28,66 28,52 C28,38 40,26 54,26 Z" />
    
    <!-- Top Exchange Arrow (Bright Warm Gold) -->
    <path
        android:fillColor="#FEF08A"
        android:pathData="M38,36 L66,36 C68.2,36 70,37.8 70,40 C70,42.2 68.2,44 66,44 L44,44 L48,48 L44,52 L34,42 L44,32 L48,36 L44,40 L38,40 Z" />

    <!-- Bottom Exchange Arrow (Pure Ivory White) -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M70,68 L42,68 C39.8,68 38,66.2 38,64 C38,61.8 39.8,60 42,60 L64,60 L60,56 L64,52 L74,62 L64,72 L60,68 L64,64 L70,64 Z" />

    <!-- Center Hryvnia ₴ Currency Symbol (Charcoal Silhouette with White Trim) -->
    <path
        android:fillColor="#18181B"
        android:pathData="M50,38 C56,38 60,42 60,47 C60,51 57,53 54,54 C58,55 61,58 61,63 C61,68 56,72 49,72 L44,72 L44,67 L49,67 C53,67 56,65 56,62 C56,59 53,57 48,57 L46,57 L46,53 L49,53 C53,53 55,51 55,48 C55,45 52,43 48,43 L44,43 L44,38 L50,38 Z" />

    <!-- Crossbars for ₴ Sign -->
    <path
        android:fillColor="#18181B"
        android:pathData="M40,48 L64,48 L64,51 L40,51 Z" />
    <path
        android:fillColor="#18181B"
        android:pathData="M40,57 L64,57 L64,60 L40,60 Z" />
</vector>
`;
fs.writeFileSync('android/app/src/main/res/drawable/ic_launcher_foreground.xml', fgXml, 'utf8');
if (fs.existsSync('android/app/src/main/res/drawable-v24')) {
  fs.writeFileSync('android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml', fgXml, 'utf8');
}

// 3. FIX MIPMAP XMLs so they use the @drawable vector icons!
const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
`;

if (fs.existsSync('android/app/src/main/res/mipmap-anydpi-v26')) {
  fs.writeFileSync('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml', adaptiveIconXml, 'utf8');
  fs.writeFileSync('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml', adaptiveIconXml, 'utf8');
}

// Update background color in values
fs.writeFileSync('android/app/src/main/res/values/ic_launcher_background.xml', `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#141416</color>\n</resources>\n`, 'utf8');

// 4. Update index.html Favicon
const svgFavicon = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 108 108'><rect width='108' height='108' rx='28' fill='%23141416'/><circle cx='54' cy='54' r='38' fill='%23F59E0B'/><path d='M38 36h28c2.2 0 4 1.8 4 4s-1.8 4-4 4H44l4 4-4 4-10-10 10-10 4 4-4 4h-6z' fill='%23FEF08A'/><path d='M70 68H42c-2.2 0-4-1.8-4-4s1.8-4 4-4h22l-4-4 4-4 10 10-10 10-4-4 4-4h6z' fill='%23FFFFFF'/><path d='M50 38c6 0 10 4 10 9 0 4-3 6-6 7 4 1 7 4 7 9 0 5-5 9-12 9h-5v-5h5c4 0 7-2 7-5s-3-5-8-5h-2v-4h3c4 0 6-2 6-5s-2-5-6-5h-4v-5h6z' fill='%2318181B'/><path d='M40 48h24v3H40zM40 57h24v3H40z' fill='%2318181B'/></svg>`;

let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(/href="data:image\/svg\+xml,[^"]+"/, `href="${svgFavicon}"`);
fs.writeFileSync('index.html', indexHtml, 'utf8');

console.log('Currencies expanded to 45+ and Golden Honey Icon created');
