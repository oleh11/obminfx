# ObminFX — Currency Converter & Bank Fee Calculator

**Obmin** (обмін) means "exchange" in Ukrainian 🇺🇦

Modern multi-source currency converter with bank processing fee calculations for Android and web.

## Features

- **Real-time exchange rates** from multiple sources (ECB, Mastercard, NBU, CurrencyLayer, Open Market)
- **Bank fee calculator** — Mastercard-style FX fee modeling that shows you the true cost of cross-border transactions
- **Historical trends & charts** — visualize rate movements over time
- **165+ currencies** including fiat, crypto, and precious metals
- **Multi-source comparison** — compare rates across official and market sources
- **Fully offline capable** with built-in baseline fallback rates
- **Native Android app** via Capacitor — install it like any Play Store app

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Material UI 9** for components
- **Recharts** for historical data visualization
- **Capacitor 8** for native Android packaging
- **canvas-confetti** for celebrations 🎉

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

## Project Structure

```
obminfx/
├── src/                    # React source
│   ├── components/         # UI components
│   ├── services/           # RateService, StorageService, FeeCalculator
│   ├── data/               # Currency database & sources config
│   ├── types/              # TypeScript types
│   └── tests/              # Verification tests
├── android/                # Capacitor Android project
├── public/                 # Static assets
└── dist/                   # Build output
```

## Rate Sources

| Source | Type | Frequency |
|--------|------|-----------|
| European Central Bank | Official Benchmark | Daily (16:00 CET) |
| National Bank of Ukraine | Official Ukrainian | Daily (09:00 UHT) |
| Mastercard FX Benchmark | Card Network Rate | Daily Fixing |
| CurrencyLayer | Global Real-Time | Minute-level |
| Open Market (er-api) | Market Rate | Live |
| Custom Bank / Issuer | User Defined | Manual |

## License

MIT — see [LICENSE](LICENSE)