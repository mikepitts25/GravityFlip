# Gravity Flip — v1.0 Build Plan

## Context

`GravityFlip` is a greenfield repo (only `README.md` and a prior `PLAN.md` draft). Goal: ship a single-tap, dual-surface endless runner to iOS App Store and Google Play with rewarded ads + $0.99 skin IAPs. Core loop: character auto-runs; tap flips gravity between floor and ceiling; obstacles spawn from both edges; AABB collision ends the run.

User decisions for this pass:
- **Scope:** Full v1.0 — MVP → juice → progression → monetization → store submission.
- **Platforms:** iOS and Android in parallel via Expo + EAS dev client.
- **Art:** Flat neon / synthwave (Skia vector shapes + glow; no sprite art pipeline).

Why it's buildable in one focused session up to playable core: the entire mechanic collapses to player Y flipping between two constants and scrolling rectangles with AABB checks. Monetization and store prep take the remainder of the work.

---

## Stack

| Concern     | Choice                                        |
|-------------|-----------------------------------------------|
| Framework   | Expo (managed) + EAS Build, TypeScript strict |
| Game loop   | `react-native-game-engine`                    |
| Animation   | `react-native-reanimated` 3 (UI-thread flip)  |
| Rendering   | `@shopify/react-native-skia` (neon FX)        |
| Audio       | `expo-av`                                     |
| Storage     | `@react-native-async-storage/async-storage`   |
| Ads         | `react-native-google-mobile-ads` (AdMob)      |
| IAP         | `react-native-iap`                            |
| Analytics   | `posthog-react-native`                        |
| State       | `zustand`                                     |

AdMob + IAP require a dev client — set up EAS dev build profile on day one for both iOS and Android.

---

## Repo Layout (files to create)

```
GravityFlip/
├── app.json, eas.json, package.json, tsconfig.json, babel.config.js
├── App.tsx                              # screen router
├── src/
│   ├── game/
│   │   ├── engine.ts                    # GameEngine wrapper
│   │   ├── entities.ts                  # initial entity factory
│   │   ├── constants.ts                 # all tunables (§ Mechanic Spec)
│   │   ├── systems/
│   │   │   ├── input.ts                 # tap → flip event
│   │   │   ├── gravity.ts               # flip state → player Y tween
│   │   │   ├── physics.ts               # world scroll
│   │   │   ├── spawner.ts               # obstacle + coin spawn
│   │   │   ├── collision.ts             # AABB → death/coin
│   │   │   ├── score.ts                 # distance + coins
│   │   │   ├── difficulty.ts            # speed + spawn-interval ramp
│   │   │   └── cleanup.ts               # cull off-screen
│   │   ├── components/                  # Player, Obstacle, Coin, Background
│   │   └── fx/                          # Trail, Particles, ScreenShake (Skia)
│   ├── screens/                         # Home, Game, GameOver, Shop, Settings
│   ├── state/
│   │   ├── gameStore.ts                 # run state (zustand)
│   │   ├── metaStore.ts                 # persisted: bestScore, coins, skin, deaths
│   │   └── storage.ts                   # AsyncStorage adapter
│   ├── services/
│   │   ├── ads.ts                       # interstitial + rewarded wrappers
│   │   ├── iap.ts                       # product catalog + purchase/restore
│   │   ├── analytics.ts                 # posthog wrapper
│   │   └── audio.ts                     # SFX preload + play
│   ├── ui/                              # buttons, HUD, modals
│   └── assets/sfx/, assets/skins/
```

---

## Mechanic Spec (all values live in `src/game/constants.ts`)

- **Surfaces:** `FLOOR_Y = height - 80 - PLAYER_H/2`, `CEIL_Y = 80 + PLAYER_H/2`. Player X fixed at 25% width.
- **Flip:** Reanimated `withTiming`, 140ms ease-out on UI thread. Collision disabled for first 40ms of flip (fair i-frames).
- **Speed:** base `320 px/s`, multiplier `1 + min(distance/2000, 1.5)` (caps at 2.5× near 3000m).
- **Spawn interval:** `lerp(1.2s, 0.45s, clamp(distance/2500, 0, 1))`.
- **Obstacles:** `spike` (floor), `stalactite` (ceiling), `pillar-gap` (both w/ gap), `dual` (unlocks at 400m), `laser` (unlocks at 800m). Weights shift from early `{spike:.5, stalactite:.3, pillar:.2}` to late `{spike:.2, stalactite:.2, pillar:.2, dual:.3, laser:.1}`.
- **Collision:** AABB; player hitbox 85% of sprite for fairness.
- **Coins:** 3–5 per row on safe paths; pickup by AABB; increments persistent wallet.

---

## Systems (react-native-game-engine)

Each system: `(entities, { time, touches, events, dispatch }) => entities`. Keep pure; one owner per field.

1. `input.ts` — consume `press` touches → `dispatch({type:'flip'})`; ignore if `player.isFlipping`.
2. `gravity.ts` — on `flip` event, toggle `player.gravity`, kick Reanimated shared-value tween to opposite Y.
3. `physics.ts` — advance world offset `speed * dt`; shift obstacle/coin X.
4. `spawner.ts` — decrement spawn timer; when ≤0, sample type from weighted table by difficulty phase, append entity, reset timer from current spawn interval.
5. `collision.ts` — AABB player vs obstacles → `dispatch({type:'death'})`; vs coins → `dispatch({type:'coin', id})` + mark coin collected.
6. `score.ts` — accumulate distance each tick; subscribe to `coin` event.
7. `difficulty.ts` — recompute `speed` and `spawnInterval` from distance.
8. `cleanup.ts` — remove entities with `x + w < 0`.

---

## Visual Direction (flat neon)

- Background: dark navy → purple gradient (Skia `LinearGradient`); parallax grid lines scrolling at 0.3× world speed.
- Player: rounded-rect shape with cyan glow (Skia `BlurMask`); skins vary hue + emissive shape (robot=square, ghost=soft blob, rocket=triangle, cat=rounded with ears).
- Obstacles: magenta/red glowing rects and triangles.
- Trail: Skia `Path` sampled from recent player positions, fading alpha.
- Death burst: 12–16 radial particles, 400ms life, additive blend.
- Screen shake: 180ms, 6px amplitude decaying.

No sprite pipeline required — everything is Skia primitives + gradients, keeps skins cheap to add.

---

## Monetization

**AdMob** (`src/services/ads.ts`):
- Preload interstitial on boot + after each show.
- Show on every 3rd death, respecting 60s floor between impressions.
- Rewarded ad on GameOverScreen → one resurrect per run with 1.5s invulnerability.
- Test IDs in dev, prod IDs via `eas.json` env per profile. Implement ATT prompt (iOS 14.5+) and Android UMP consent.

**IAP** (`src/services/iap.ts`):
- Products: `skin_robot`, `skin_ghost`, `skin_rocket`, `skin_cat` @ $0.99; `skin_pack_all` @ $2.99 (grants all + future).
- Restore-purchases button in Settings.
- Entitlements cached in `metaStore`; client-side trust for v1 (receipt validation deferred).

**Analytics** (`src/services/analytics.ts`):
Events: `session_start`, `run_start`, `flip`, `death` (distance, flipCount), `coin_pickup`, `interstitial_shown`, `rewarded_offered`, `rewarded_completed`, `iap_viewed`, `iap_purchased`, `skin_equipped`.
Funnels to dashboard: install→first_run; death→retry; death→rewarded_offered→completed→survived; shop_view→purchase.

---

## Milestones (commit after each)

1. `chore: scaffold Expo + TS + deps + EAS dev profiles (iOS & Android)`
2. `feat(game): engine + player renders at floor/ceiling`
3. `feat(input): tap flips gravity with Reanimated tween`
4. `feat(spawner): floor/ceiling/pillar obstacles scroll`
5. `feat(collision): AABB + death state + restart loop`
6. `feat(ui): Home + GameOver screens, best-score persistence`
7. `feat(difficulty): speed ramp + dual-surface unlock at 400m`
8. `feat(fx): Skia trail, particles, screen shake, SFX, haptics`
9. `feat(coins): pickups + wallet + HUD`
10. `feat(ads): interstitial every-3-deaths + rewarded resurrect + consent`
11. `feat(iap): 4 skins + pack, shop screen, restore, skin equip`
12. `feat(analytics): PostHog events + funnels`
13. `chore(release): icon, splash, store screenshots, privacy manifest`
14. `chore(ship): TestFlight + Play Internal Testing submission`

---

## Key Files to Create/Modify

- `package.json`, `app.json`, `eas.json`, `tsconfig.json` — project scaffold.
- `App.tsx` — screen router + providers (ads init, analytics init, audio preload).
- `src/game/constants.ts` — single source of truth for tunables; iteration happens here.
- `src/game/systems/*.ts` — eight system files above.
- `src/game/components/Player.tsx`, `Obstacle.tsx`, `Coin.tsx`, `Background.tsx` — Skia renderers.
- `src/game/fx/Trail.tsx`, `Particles.tsx`, `ScreenShake.tsx` — neon FX.
- `src/screens/HomeScreen.tsx`, `GameScreen.tsx`, `GameOverScreen.tsx`, `ShopScreen.tsx`, `SettingsScreen.tsx`.
- `src/state/gameStore.ts`, `metaStore.ts`, `storage.ts`.
- `src/services/ads.ts`, `iap.ts`, `analytics.ts`, `audio.ts`.

No existing code to reuse (greenfield beyond `README.md`).

---

## Risks & Mitigations

| Risk                                          | Mitigation                                                     |
|-----------------------------------------------|----------------------------------------------------------------|
| JS thread jitter breaks feel                  | Flip tween on UI thread (Reanimated shared values); keep entity count < 40; profile on mid-range Android. |
| Expo Go can't load AdMob / IAP native modules | Provision EAS dev client for both platforms in milestone 1.    |
| IAP sandbox flakiness blocks milestone 11     | Feature-flag IAP; if blocked, ship v0.9 with ads only and follow up. |
| Skia perf regression with many particles      | Cap particles (≤32 live); additive blend on a single `Picture`.|
| iOS ATT + Android UMP consent misconfig       | Implement prompts before first ad request; verify in pre-submission checklist. |

---

## Verification (end-to-end)

Per-milestone checks (run on EAS dev client, iOS simulator + a physical Android):

1. **Scaffold:** `npx expo start` boots; `eas build --profile development` succeeds for both platforms.
2. **Core loop (milestones 2–6):** tap flips player between Y bounds; obstacles scroll and collide; death transitions to GameOver; restart works; best score persists across kill.
3. **Difficulty (7):** speed visibly ramps; dual obstacles start appearing near 400m; no impossible patterns (manual play 10 runs, log min-gap).
4. **FX & juice (8):** 60fps on a mid-range Android during particle burst (verify via Perf Monitor).
5. **Coins (9):** pickup increments wallet; wallet persists across runs and app restarts.
6. **Ads (10):** interstitial shows on 3rd, 6th, 9th death with ≥60s gap; rewarded resurrect spawns with 1.5s invuln; both platforms with consent flows.
7. **IAP (11):** sandbox purchase of each skin unlocks it; `skin_pack_all` unlocks all four; restore works on fresh install (same account).
8. **Analytics (12):** all event names appear in PostHog within 1 minute; the four funnels render data.
9. **Release (13–14):** icon + splash render correctly; store listings accepted; TestFlight build installable; Play Internal track build installable.

Acceptance gate for v1.0: 10-minute continuous play session with no memory growth (Xcode Instruments / Android Studio Profiler), crash-free, 60fps sustained on Pixel 5-class device.
