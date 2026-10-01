import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "de.p34nuts.burgfried",
  appName: "Burgfried",
  webDir: "dist/public",
  android: {
    backgroundColor: "#17425f",
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      launchAutoHide: true,
      backgroundColor: "#17425f",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
