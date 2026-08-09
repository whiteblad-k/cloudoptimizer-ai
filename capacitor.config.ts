import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cloudoptimizer.ai",
  appName: "CloudOptimizer AI",
  webDir: "dist",
  server: {
    androidScheme: "https",
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#020617",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
