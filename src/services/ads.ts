/**
 * Ads facade for AdMob (react-native-google-mobile-ads).
 *
 * The native module is loaded lazily and guarded: in Expo Go or any build
 * without the module, every method degrades gracefully so gameplay is never
 * blocked. Wire real ads by adding the dependency and running a dev client.
 *
 *  - Interstitial: shown on every 3rd death, min 60s between impressions.
 *  - Rewarded: one resurrect per run.
 */
import { track } from './analytics';

const INTERSTITIAL_EVERY = 3;
const MIN_INTERSTITIAL_GAP_MS = 60_000;

let lastInterstitialAt = 0;

// Resolved lazily; null means ads are unavailable in this build.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mobileAds: any = null;
let available = false;

export async function initAds(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('react-native-google-mobile-ads');
    mobileAds = mod;
    await mod.default().initialize();
    available = true;
  } catch {
    available = false; // running without the native module — that's fine
  }
}

/** Decide-and-show an interstitial based on the cumulative death count. */
export async function maybeShowInterstitial(deathCount: number): Promise<void> {
  if (deathCount % INTERSTITIAL_EVERY !== 0) return;
  const now = Date.now();
  if (now - lastInterstitialAt < MIN_INTERSTITIAL_GAP_MS) return;
  if (!available) return;
  try {
    const { InterstitialAd, AdEventType, TestIds } = mobileAds;
    const unitId =
      process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL ?? TestIds.INTERSTITIAL;
    await new Promise<void>((resolve) => {
      const ad = InterstitialAd.createForAdRequest(unitId);
      const onLoaded = ad.addAdEventListener(AdEventType.LOADED, () => ad.show());
      const onClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        onLoaded();
        onClosed();
        resolve();
      });
      ad.load();
    });
    lastInterstitialAt = now;
    track('interstitial_shown', { deathCount });
  } catch {
    // swallow — never block the death flow on an ad
  }
}

/**
 * Show a rewarded ad. Resolves true if the reward was earned (or, when ads are
 * unavailable in this build, true so testing the resurrect flow still works).
 */
export async function showRewarded(): Promise<boolean> {
  track('rewarded_offered');
  if (!available) {
    track('rewarded_completed', { simulated: true });
    return true;
  }
  try {
    const { RewardedAd, RewardedAdEventType, TestIds } = mobileAds;
    const unitId = process.env.EXPO_PUBLIC_ADMOB_REWARDED ?? TestIds.REWARDED;
    return await new Promise<boolean>((resolve) => {
      const ad = RewardedAd.createForAdRequest(unitId);
      let earned = false;
      const onLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => ad.show());
      const onEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      });
      const onClosed = ad.addAdEventListener('closed', () => {
        onLoaded();
        onEarned();
        onClosed();
        if (earned) track('rewarded_completed');
        resolve(earned);
      });
      ad.load();
    });
  } catch {
    return false;
  }
}
