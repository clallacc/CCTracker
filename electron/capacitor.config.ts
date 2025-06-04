import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gillettegroup.cctracker",
  appName: "CCTracker",
  webDir: "dist",
  plugins: {
    server: {
      androidScheme: "https",
    },
    GoogleMaps: {
      apiKey: "AIzaSyCR4eiy5WOt_JlIjCV-Fm4gkmWTNhtHTU4",
    },
  },
};

export default config;
