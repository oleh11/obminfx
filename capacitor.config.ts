import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.obminfx.app",
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
    // Dark status bar and navigation bar icons on the light background
    SystemBars: {
      style: "LIGHT",
    },
  },
};

export default config;