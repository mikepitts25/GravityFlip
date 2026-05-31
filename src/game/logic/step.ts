import {
  CEIL_Y,
  FLIP_IFRAME_MS,
  FLOOR_Y,
  OBSTACLE_W,
  PLAYER_SIZE,
  PLAYER_X,
  RESURRECT_INVULN_MS,
} from '../constants';
import type { GameState, Player, StepEvents } from '../types';
import { boxesOverlap, coinHitsPlayer, playerHitbox } from './collision';
import { speedFor, spawnIntervalFor } from './difficulty';
import { advanceFlip, startFlip } from './flip';
import { makeObstacle, maybeMakeCoins, pickKind } from './spawner';
import { createRng, type Rng } from './rng';

export function createInitialPlayer(): Player {
  return {
    x: PLAYER_X,
    y: FLOOR_Y,
    gravity: 'floor',
    isFlipping: false,
    flipElapsed: 0,
    flipFrom: FLOOR_Y,
    flipTo: FLOOR_Y,
    alive: true,
    invulnUntil: 0,
  };
}

export function createInitialState(): GameState {
  return {
    time: 0,
    distance: 0,
    speed: speedFor(0),
    spawnTimer: 0.6,
    player: createInitialPlayer(),
    obstacles: [],
    coins: [],
    coinsCollected: 0,
    status: 'ready',
    nextId: 1,
    usedResurrect: false,
  };
}

export interface StepInput {
  dtMs: number; // frame delta in milliseconds (clamped by caller)
  flip: boolean; // a tap occurred this frame
  rng: Rng;
}

const noEvents: StepEvents = { died: false, flipped: false, coinsPickedThisStep: 0 };

/**
 * Advance the whole simulation by one frame. Pure: mutates and returns the
 * passed state, with no side effects beyond it. The view layer reads the
 * returned events to trigger audio / haptics / FX.
 */
export function step(state: GameState, input: StepInput): StepEvents {
  if (state.status !== 'running') {
    // Allow a flip to be buffered visually even when not running; ignore.
    return noEvents;
  }
  const dtSec = input.dtMs / 1000;
  const events: StepEvents = { died: false, flipped: false, coinsPickedThisStep: 0 };

  state.time += input.dtMs;

  // Input
  if (input.flip && startFlip(state.player)) {
    events.flipped = true;
  }
  advanceFlip(state.player, input.dtMs);

  // Difficulty + scroll
  state.speed = speedFor(state.distance);
  const dx = state.speed * dtSec;
  state.distance += dx;

  for (const o of state.obstacles) {
    for (const b of o.boxes) b.x -= dx;
  }
  for (const c of state.coins) c.x -= dx;

  // Spawning
  state.spawnTimer -= dtSec;
  if (state.spawnTimer <= 0) {
    const kind = pickKind(state.distance, input.rng);
    state.obstacles.push(makeObstacle(state.nextId++, kind, input.rng));
    const { coins, idsUsed } = maybeMakeCoins(state.nextId, input.rng);
    if (idsUsed > 0) {
      state.nextId += idsUsed;
      state.coins.push(...coins);
    }
    state.spawnTimer += spawnIntervalFor(state.distance);
  }

  // Cull off-screen entities
  state.obstacles = state.obstacles.filter((o) =>
    o.boxes.some((b) => b.x + b.w > -OBSTACLE_W),
  );
  state.coins = state.coins.filter((c) => c.x > -100 && !c.collected);

  // Coin collection
  for (const c of state.coins) {
    if (!c.collected && coinHitsPlayer(c, state.player)) {
      c.collected = true;
      state.coinsCollected += 1;
      events.coinsPickedThisStep += 1;
    }
  }

  // Collision (respect i-frames at flip start and resurrect invulnerability)
  const inFlipIframe = state.player.isFlipping && state.player.flipElapsed < FLIP_IFRAME_MS;
  const invuln = state.time < state.player.invulnUntil;
  if (!inFlipIframe && !invuln) {
    const hb = playerHitbox(state.player);
    for (const o of state.obstacles) {
      if (o.boxes.some((b) => boxesOverlap(hb, b))) {
        state.player.alive = false;
        state.status = 'dead';
        events.died = true;
        break;
      }
    }
  }

  return events;
}

/** Bring a dead player back for one rewarded resurrect. */
export function resurrect(state: GameState): boolean {
  if (state.status !== 'dead' || state.usedResurrect) return false;
  state.usedResurrect = true;
  state.player.alive = true;
  state.player.invulnUntil = state.time + RESURRECT_INVULN_MS;
  state.status = 'running';
  // Clear nearby hazards so the player isn't instantly re-killed.
  const safeX = state.player.x + PLAYER_SIZE + 400;
  state.obstacles = state.obstacles.filter((o) =>
    o.boxes.every((b) => b.x > safeX || b.x + b.w < state.player.x - 50),
  );
  return true;
}

export function startRun(state: GameState): void {
  const fresh = createInitialState();
  Object.assign(state, fresh, { status: 'running' });
}

export { createRng };
export { CEIL_Y, FLOOR_Y };
