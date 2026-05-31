# Gravity Flip

A single-tap, dual-surface endless runner. Your character auto-runs; **tap anywhere to flip gravity** between floor and ceiling. Dodge hazards that spawn from both edges, grab coins, and survive as long as you can. Flat-neon / synthwave look, built with Expo + Skia.

See [`PLAN.md`](./PLAN.md) for the full design and roadmap.

## Run it

```bash
npm install
npm start            # Expo dev server; press i / a / w for iOS / Android / web
```

> Skia, Reanimated, AdMob, and IAP need a **dev client** (not Expo Go) for full
> functionality. Ads/IAP/analytics are feature-flagged and degrade gracefully,
> so the core game runs without any store or key setup.

## Verify

```bash
npm run typecheck    # tsc --noEmit across the app
npm test             # Jest unit tests for the pure simulation core
```

The entire game simulation lives in dependency-free modules under
`src/game/logic/` and `src/game/constants.ts`, so it is fully unit-tested in a
plain Node environment (collision, flip, spawner, difficulty, resurrect,
determinism).

## Architecture

```
src/
  game/
    constants.ts        # all gameplay tunables (single source of truth)
    types.ts            # pure simulation types
    logic/              # PURE, testable sim: rng, difficulty, spawner,
                        #   collision, flip, step (+ logic.test.ts)
    render/             # Skia rendering: GameView (RAF loop), PlayerShape, palette
    skins.ts            # neon skin catalog + IAP SKUs
  screens/              # Home, Game (+ game-over overlay), Shop, Settings
  state/                # zustand stores: metaStore (persisted), storage
  services/             # ads, iap, analytics, audio  (all feature-flagged)
  ui/                   # NeonButton
App.tsx                 # boot + lightweight screen router
```

### How the loop works
`GameView` holds the `GameState` in a ref and runs a `requestAnimationFrame`
loop. Each frame it calls the pure `step()` with the frame delta and any queued
tap, then bumps a counter to re-render the Skia `<Canvas>` from the new state.
Keeping all logic pure makes the game deterministic (seeded RNG) and testable.

## Monetization (wired, feature-flagged)
- **Interstitial** every 3rd death (60s floor between shows).
- **Rewarded** ad → one resurrect per run with 1.5s invulnerability.
- **IAP**: four $0.99 skins + a $2.99 all-skins pack; restore supported.
- **Analytics** events for the full funnel (PostHog when a key is set).

Provide real IDs via env (`EXPO_PUBLIC_ADMOB_*`, `EXPO_PUBLIC_POSTHOG_KEY`) and
build a dev client to activate the native modules.
