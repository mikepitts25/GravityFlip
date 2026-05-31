/**
 * Analytics facade. Logs events in dev; to enable PostHog:
 *   1. npm install posthog-react-native
 *   2. Set EXPO_PUBLIC_POSTHOG_KEY env var
 *   3. Uncomment the require block in initAnalytics()
 */

export type AnalyticsEvent =
  | 'session_start'
  | 'run_start'
  | 'flip'
  | 'death'
  | 'coin_pickup'
  | 'interstitial_shown'
  | 'rewarded_offered'
  | 'rewarded_completed'
  | 'iap_viewed'
  | 'iap_purchased'
  | 'skin_equipped';

type Props = Record<string, string | number | boolean | undefined>;

export function initAnalytics(): void {
  // Native PostHog module not installed — dev-log mode.
  // When posthog-react-native is installed:
  //   const PostHog = require('posthog-react-native').default;
  //   client = new PostHog(key, { host: '...' });
}

export function track(event: AnalyticsEvent, props?: Props): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, props ?? {});
  }
}
