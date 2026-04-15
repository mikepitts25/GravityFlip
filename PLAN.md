# Gravity Flip — Build Plan

A single-tap, dual-surface endless runner. Tap to flip gravity between floor and ceiling; dodge obstacles spawning from both edges. Target: shippable MVP in a single focused Claude Code session, then polish + monetization.

---

## 1. Product Scope

### MVP (v0.1 — Playable Core)
- Auto-running character with two fixed Y positions (floor / ceiling).
- Single-tap input flips gravity with a smooth snap animation.
- Obstacle spawner that emits floor-mounted, ceiling-mounted, and gap obstacles.
- AABB collision → game over.
- Score = distance traveled. Best score persisted locally.
- Start screen, game-over screen, tap-to-restart.

### v0.2 — Feel & Juice
- Screen shake, flash, and particle burst on collision.
- Trail effect behind character (Skia).
- Speed ramp curve (see §4.3).
- SFX: flip, coin, death, milestone.
- Haptics on flip + death.

### v0.3 — Progression & Coins
- Mid-air coin pickups (AABB check).
- Persistent coin wallet (AsyncStorage).
- Milestone rewards every 100m.

### v0.4 — Monetization
- AdMob interstitial every 3 deaths.
- Rewarded ad: one resurrect per run.
- IAP: four $0.99 skins + $2.99 pack.
- Skin picker screen.

### v0.5 — Polish & Ship
- Settings (mute, haptics toggle).
- Analytics funnels.
- App icon, splash, store screenshots.
- iOS TestFlight + Android internal testing.

---

## 2. Tech Stack

| Concern        | Choice                               | Why                                              |
|----------------|--------------------------------------|--------------------------------------------------|
| Framework      | Expo (managed) + EAS                 | Fast iteration; prebuild when native modules need it |
| Game loop      | `react-native-game-engine`           | ECS + requestAnimationFrame tick                 |
| Animations     | `react-native-reanimated` 3          | 60fps flip snap on UI thread                     |
| Rendering FX   | `@shopify/react-native-skia`         | Trails, particles, gradients                     |
| Audio          | `expo-av`                            | SFX, background loop                             |
| Persistence    | `@react-native-async-storage/async-storage` | Best score, coins, skin, settings         |
| Ads            | `react-native-google-mobile-ads`     | AdMob SDK                                        |
| IAP            | `react-native-iap`                   | Cross-platform storekit/billing                  |
| Analytics      | PostHog (free tier)                  | Funnels + retention                              |
| State          | Zustand                              | Tiny, no boilerplate                             |
| Lint/format    | ESLint + Prettier + TypeScript strict| Catch bugs early                                 |

> AdMob + IAP require a dev build (not Expo Go). Plan for `eas build --profile development` once monetization lands.

---

## 3. Repository Layout

```
GravityFlip/
├── app.json                    # Expo config
├── eas.json                    # Build profiles
├── package.json
├── tsconfig.json
├── babel.config.js
├── App.tsx                     # Root; screen router
├── src/
│   ├── game/
│   │   ├── engine.ts           # GameEngine wrapper
│   │   ├── entities.ts         # Initial entity factory
│   │   ├── systems/
│   │   │   ├── gravity.ts      # Applies flip state → player Y
│   │   │   ├── physics.ts      # World scroll + obstacle motion
│   │   │   ├── spawner.ts      # Obstacle + coin spawning
│   │   │   ├── collision.ts    # AABB checks → dispatch events
│   │   │   ├── input.ts        # Tap → flip event
│   │   │   ├── score.ts        # Distance + coin counter
│   │   │   └── difficulty.ts   # Speed ramp over time
│   │   ├── components/
│   │   │   ├── Player.tsx
│   │   │   ├── Obstacle.tsx
│   │   │   ├── Coin.tsx
│   │   │   └── Background.tsx  # Parallax (Skia)
│   │   ├── fx/
│   │   │   ├── Trail.tsx       # Skia path
│   │   │   ├── Particles.tsx
│   │   │   └── ScreenShake.tsx
│   │   └── constants.ts        # Tunables (see §4)
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── GameScreen.tsx
│   │   ├── GameOverScreen.tsx
│   │   ├── ShopScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── state/
│   │   ├── gameStore.ts        # Run state (score, isAlive, flipCount)
│   │   ├── metaStore.ts        # Persistent (bestScore, coins, skin)
│   │   └── storage.ts          # AsyncStorage adapter
│   ├── services/
│   │   ├── ads.ts              # Interstitial + rewarded wrappers
│   │   ├── iap.ts              # Product catalog + purchase flow
│   │   ├── analytics.ts        # PostHog wrapper
│   │   └── audio.ts            # SFX preload + play
│   ├── ui/                     # Buttons, HUD, modals
│   └── assets/
│       ├── sfx/
│       ├── images/
│       └── skins/
└── PLAN.md
```

---

## 4. Core Mechanic Spec

### 4.1 World Model
- Coordinate space: viewport width × height in px. Scroll right → obstacles move left.
- Two surfaces:
  - `FLOOR_Y = height - 80 - PLAYER_H/2`
  - `CEIL_Y  = 80 + PLAYER_H/2`
- Player X is fixed at ~25% of width. Only Y flips.

### 4.2 Player State
```ts
type Gravity = 'floor' | 'ceiling';
type Player = {
  x: number;           // fixed
  y: number;           // animated between FLOOR_Y and CEIL_Y
  gravity: Gravity;
  isFlipping: boolean; // prevents double-flips mid-transition
  alive: boolean;
};
```
- Flip duration: 140ms ease-out (Reanimated `withTiming`).
- Collision is disabled for first 40ms of a flip to avoid punishing near-misses.

### 4.3 Difficulty Curve
- Base scroll speed: 320 px/s.
- Multiplier: `1 + min(distance / 2000, 1.5)` — caps at 2.5× around 3000m.
- Spawn interval: `lerp(1.2s, 0.45s, progress)` where `progress = clamp(distance / 2500, 0, 1)`.
- Dual-surface (simultaneous floor + ceiling obstacles) unlocks at 400m.

### 4.4 Obstacle Types
| Type         | Surface     | Requires        | Notes                        |
|--------------|-------------|------------------|------------------------------|
| `spike`      | floor       | be on ceiling   | Most common early            |
| `stalactite` | ceiling     | be on floor     | Mirrored spike               |
| `pillar-gap` | both        | pass through gap| Gap position is floor or ceiling|
| `dual`       | both        | gravity-dependent| Unlocks at 400m             |
| `laser`      | mid         | either surface OK if aligned | Appears at 800m   |

Spawn weighting shifts from `{spike:0.5, stalactite:0.3, pillar:0.2}` early to `{spike:0.2, stalactite:0.2, pillar:0.2, dual:0.3, laser:0.1}` late.

### 4.5 Collision
- AABB per obstacle vs player hitbox (slightly smaller than sprite for fairness — ~85%).
- On collision: set `alive=false`, trigger death FX, transition to GameOverScreen after 600ms.

### 4.6 Coins
- Spawn in mid-air rows of 3–5 along safe paths between obstacles.
- Pickup radius check; increment wallet.

---

## 5. Systems (react-native-game-engine)

Each system signature: `(entities, { time, touches, events, dispatch }) => entities`.

1. **InputSystem** — consumes `press` touches → `dispatch({ type: 'flip' })`.
2. **GravitySystem** — on `flip` event, toggles `player.gravity` and kicks a Reanimated tween.
3. **PhysicsSystem** — advances world offset by `speed * dt`; shifts obstacle/coin X.
4. **SpawnerSystem** — maintains spawn timer; picks obstacle type by weighted table; appends entity.
5. **CollisionSystem** — AABB player vs obstacles → `dispatch({ type: 'death' })`; vs coins → `dispatch({ type: 'coin' })`.
6. **ScoreSystem** — accumulates distance; listens for `coin`.
7. **DifficultySystem** — updates `speed` and `spawnInterval` based on distance.
8. **CleanupSystem** — removes entities past left edge.

Keep systems pure and independent; only mutate entity fields they own.

---

## 6. Monetization Integration

### Ads (AdMob)
- Preload interstitial on app start and after each show.
- Death counter in `metaStore`: show interstitial on every 3rd death (respect a 60s floor between shows).
- Rewarded ad button on GameOverScreen: one resurrect per run; player spawns with 1.5s invulnerability.
- Test IDs during development; production IDs behind env vars in `eas.json`.

### IAP
- Products: `skin_robot`, `skin_ghost`, `skin_rocket`, `skin_cat` ($0.99), `skin_pack_all` ($2.99).
- Restore purchases button in Settings.
- Entitlement cached in `metaStore`; server-side validation deferred (accept client claim for v1, add receipt validation later).

### Analytics events
`session_start`, `run_start`, `flip`, `death`, `coin_pickup`, `interstitial_shown`, `rewarded_offered`, `rewarded_completed`, `iap_viewed`, `iap_purchased`, `skin_equipped`.

Key funnels: install → first run, first death → retry, death → rewarded offered → watched → survived.

---

## 7. Risk & Mitigations

| Risk                                    | Mitigation                                         |
|-----------------------------------------|----------------------------------------------------|
| JS thread hiccups cause jitter          | Drive flip tween on UI thread via Reanimated; keep systems O(n) on small entity counts (<40). |
| AdMob + Expo Go incompatibility         | Switch to dev client early; verify on physical device before monetization work. |
| IAP sandbox flakiness                   | Feature-flag IAP; ship v0.3 without it if blocked. |
| Feel too punishing / too easy           | Tunables in `constants.ts`; playtest log flipCount vs death distance. |
| iOS ATT prompt hurts ad revenue         | Standard SKAdNetwork config; accept and move on.   |

---

## 8. Milestones & Commit Cadence

Commit after each working system. Suggested sequence:

1. `chore: scaffold Expo + TS + deps`
2. `feat(game): engine + player renders at floor/ceiling`
3. `feat(input): tap flips gravity with Reanimated tween`
4. `feat(spawner): floor/ceiling/pillar obstacles scroll`
5. `feat(collision): AABB + death state`
6. `feat(ui): home + game-over screens, restart loop`
7. `feat(score): distance + best score persistence`
8. `feat(fx): trail, particles, screen shake, SFX`
9. `feat(difficulty): speed ramp + dual-surface unlock`
10. `feat(coins): pickups + wallet`
11. `feat(ads): interstitial + rewarded resurrect`
12. `feat(iap): skins + shop screen`
13. `feat(analytics): PostHog events`
14. `chore(release): icons, splash, store assets`

---

## 9. Definition of Done (v1.0)

- 60fps on a 3-year-old midrange Android (e.g., Pixel 5 / Galaxy A52).
- No memory growth over a 10-minute session.
- Crash-free sessions > 99% in first week.
- Interstitial + rewarded + at least one IAP verified on real devices (both stores).
- Analytics dashboards live for the funnels in §6.
- Store listings submitted to TestFlight and Play Internal Testing.

---

## 10. Open Questions

- Art direction: flat/neon vs pixel? Decision gates skin roster and particle palette.
- Music: looping synth track or SFX only? (Audio-off default on mobile is common; plan SFX-first.)
- Leaderboards (Game Center / Play Games) — in scope for v1 or later?
- Daily challenge mode — fits the hook but adds UI scope; defer to v1.1.
