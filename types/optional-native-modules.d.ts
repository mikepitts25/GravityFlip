/**
 * Ambient stubs for optional native modules that are loaded lazily and only
 * present in a full dev/production build (not in Expo Go or local CI). The
 * service facades in src/services/* import these dynamically and degrade
 * gracefully when they are absent, so a permissive `any` shape is correct here.
 *
 * To enable real ads / IAP / analytics, install the packages and build a dev
 * client; these declarations keep the typecheck green either way.
 */

declare module 'react-native-google-mobile-ads' {
  const anyExport: any;
  export = anyExport;
}

declare module 'react-native-iap' {
  const anyExport: any;
  export = anyExport;
}

declare module 'posthog-react-native' {
  const anyExport: any;
  export default anyExport;
}

// React Native dev flag and public env vars used by the service facades.
declare const __DEV__: boolean;
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_POSTHOG_KEY?: string;
    EXPO_PUBLIC_POSTHOG_HOST?: string;
    EXPO_PUBLIC_ADMOB_INTERSTITIAL?: string;
    EXPO_PUBLIC_ADMOB_REWARDED?: string;
  }
}
declare const process: { env: NodeJS.ProcessEnv };
