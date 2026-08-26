import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.currencyconverter.app",
  appName: "ObminFX",
  webDir: "dist",
  server: {
    androidScheme: "https"
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;