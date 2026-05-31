/**
 * Analytics facade. Wraps PostHog when a key is configured; otherwise logs in
 * dev and is a no-op in production. Keeps the rest of the app decoupled from
 * the vendor and lets the game run with zero analytics setup.
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

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;

let client: { capture: (e: string, p?: Props) => void } | null = null;

export async function initAnalytics(): Promise<void> {
  if (!POSTHOG_KEY) return; // disabled — facade becomes a no-op/logger
  try {
    // Lazy import so the dependency is optional for local/dev builds.
    const mod = await import('posthog-react-native');
    const PostHog = (mod as { default?: unknown }).default ?? mod;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client = new (PostHog as any)(POSTHOG_KEY, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    });
  } catch {
    client = null;
  }
}

export function track(event: AnalyticsEvent, props?: Props): void {
  if (client) {
    client.capture(event, props);
  } else if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, props ?? {});
  }
}
