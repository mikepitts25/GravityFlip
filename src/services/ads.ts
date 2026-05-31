/**
 * Ads facade for AdMob (react-native-google-mobile-ads).
 *
 * Currently a stub — the native module isn't installed. All methods degrade
 * gracefully: interstitials are skipped, rewarded ads auto-grant so the
 * resurrect flow is testable. To enable real ads:
 *   1. npm install react-native-google-mobile-ads
 *   2. Build a dev client (not Expo Go)
 *   3. Uncomment the require + init block in initAds()
 */
import { track } from './analytics';

const INTERSTITIAL_EVERY = 3;
const MIN_INTERSTITIAL_GAP_MS = 60_000;

let lastInterstitialAt = 0;
const available = false;

export function initAds(): void {
  // Native module not installed — stub mode.
  // When react-native-google-mobile-ads is installed + dev client built:
  //   mobileAds = require('react-native-google-mobile-ads');
  //   mobileAds.default().initialize();
  //   available = true;
}

export async function maybeShowInterstitial(deathCount: number): Promise<void> {
  if (deathCount % INTERSTITIAL_EVERY !== 0) return;
  const now = Date.now();
  if (now - lastInterstitialAt < MIN_INTERSTITIAL_GAP_MS) return;
  if (!available) return;
  lastInterstitialAt = now;
  track('interstitial_shown', { deathCount });
}

export async function showRewarded(): Promise<boolean> {
  track('rewarded_offered');
  if (!available) {
    track('rewarded_completed', { simulated: true });
    return true;
  }
  return false;
}
