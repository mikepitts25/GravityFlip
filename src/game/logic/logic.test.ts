import {
  BASE_SPEED,
  CEIL_Y,
  DUAL_UNLOCK,
  FLIP_MS,
  FLOOR_Y,
  LASER_UNLOCK,
  MAX_SPEED_MULT,
} from '../constants';
import { boxesOverlap, coinHitsPlayer, playerHitbox } from './collision';
import { spawnIntervalFor, speedFor } from './difficulty';
import { advanceFlip, startFlip, targetYFor } from './flip';
import { createRng } from './rng';
import { pickKind, weightsFor } from './spawner';
import {
  createInitialPlayer,
  createInitialState,
  resurrect,
  startRun,
  step,
  type StepInput,
} from './step';
import type { Coin } from '../types';

const rng = () => createRng(12345);

function input(over: Partial<StepInput> = {}): StepInput {
  return { dtMs: 16.67, flip: false, rng: rng(), ...over };
}

describe('difficulty', () => {
  test('speed starts at base and caps at max multiplier', () => {
    expect(speedFor(0)).toBeCloseTo(BASE_SPEED);
    expect(speedFor(1_000_000)).toBeCloseTo(BASE_SPEED * MAX_SPEED_MULT);
  });
  test('speed is monotonically non-decreasing', () => {
    let prev = 0;
    for (let d = 0; d < 20000; d += 500) {
      const s = speedFor(d);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });
  test('spawn interval tightens with distance', () => {
    expect(spawnIntervalFor(0)).toBeGreaterThan(spawnIntervalFor(10000));
  });
});

describe('flip', () => {
  test('startFlip toggles gravity and is rejected mid-flip', () => {
    const p = createInitialPlayer();
    expect(startFlip(p)).toBe(true);
    expect(p.gravity).toBe('ceiling');
    expect(p.isFlipping).toBe(true);
    expect(startFlip(p)).toBe(false); // already flipping
  });
  test('advanceFlip reaches target Y and ends', () => {
    const p = createInitialPlayer();
    startFlip(p);
    advanceFlip(p, FLIP_MS); // one big step to completion
    expect(p.isFlipping).toBe(false);
    expect(p.y).toBeCloseTo(targetYFor('ceiling'));
    expect(p.y).toBeCloseTo(CEIL_Y);
  });
  test('flip lands back on floor after two flips', () => {
    const p = createInitialPlayer();
    startFlip(p);
    advanceFlip(p, FLIP_MS);
    startFlip(p);
    advanceFlip(p, FLIP_MS);
    expect(p.gravity).toBe('floor');
    expect(p.y).toBeCloseTo(FLOOR_Y);
  });
});

describe('collision', () => {
  test('boxesOverlap basic cases', () => {
    expect(boxesOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(boxesOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 0, w: 10, h: 10 })).toBe(false);
  });
  test('hitbox is smaller than the sprite', () => {
    const p = createInitialPlayer();
    const hb = playerHitbox(p);
    expect(hb.w).toBeLessThan(96);
    expect(hb.x).toBeGreaterThan(p.x);
  });
  test('coin overlapping the player is collected', () => {
    const p = createInitialPlayer();
    const hb = playerHitbox(p);
    const coin: Coin = { id: 1, x: hb.x + hb.w / 2, y: hb.y + hb.h / 2, collected: false };
    expect(coinHitsPlayer(coin, p)).toBe(true);
  });
});

describe('spawner', () => {
  test('dual and laser unlock with distance', () => {
    const early = weightsFor(0).map((w) => w.kind);
    expect(early).not.toContain('dual');
    expect(early).not.toContain('laser');
    expect(weightsFor(DUAL_UNLOCK).map((w) => w.kind)).toContain('dual');
    expect(weightsFor(LASER_UNLOCK).map((w) => w.kind)).toContain('laser');
  });
  test('pickKind only returns unlocked kinds', () => {
    const r = createRng(7);
    for (let i = 0; i < 200; i++) {
      const k = pickKind(0, r);
      expect(['spike', 'stalactite', 'pillar']).toContain(k);
    }
  });
});

describe('step / simulation', () => {
  test('does nothing until running', () => {
    const s = createInitialState();
    const e = step(s, input());
    expect(e.died).toBe(false);
    expect(s.distance).toBe(0);
  });

  test('startRun advances distance and spawns obstacles over time', () => {
    const s = createInitialState();
    startRun(s);
    for (let i = 0; i < 180; i++) step(s, input()); // ~3s
    expect(s.distance).toBeGreaterThan(0);
    expect(s.obstacles.length).toBeGreaterThan(0);
  });

  test('a tap flips the player while running', () => {
    const s = createInitialState();
    startRun(s);
    const e = step(s, input({ flip: true }));
    expect(e.flipped).toBe(true);
    expect(s.player.gravity).toBe('ceiling');
  });

  test('player can die from a collision', () => {
    const s = createInitialState();
    startRun(s);
    // Force an obstacle straight onto the player.
    const hb = playerHitbox(s.player);
    s.obstacles.push({
      id: 999,
      kind: 'spike',
      boxes: [{ x: hb.x, y: hb.y, w: hb.w, h: hb.h }],
    });
    step(s, input());
    expect(s.status).toBe('dead');
    expect(s.player.alive).toBe(false);
  });

  test('i-frames protect the player at the very start of a flip', () => {
    const s = createInitialState();
    startRun(s);
    step(s, input({ flip: true })); // begin flip; flipElapsed small
    const hb = playerHitbox(s.player);
    s.obstacles.push({
      id: 998,
      kind: 'spike',
      boxes: [{ x: hb.x, y: hb.y, w: hb.w, h: hb.h }],
    });
    // tiny dt keeps us inside the i-frame window
    step(s, { dtMs: 5, flip: false, rng: rng() });
    expect(s.status).toBe('running');
  });

  test('resurrect revives once with invulnerability and clears nearby hazards', () => {
    const s = createInitialState();
    startRun(s);
    s.player.alive = false;
    s.status = 'dead';
    s.obstacles.push({
      id: 1,
      kind: 'spike',
      boxes: [{ x: s.player.x, y: s.player.y, w: 90, h: 90 }],
    });
    expect(resurrect(s)).toBe(true);
    expect(s.status).toBe('running');
    expect(s.player.invulnUntil).toBeGreaterThan(s.time);
    expect(resurrect(s)).toBe(false); // only once per run
  });

  test('invulnerability prevents death', () => {
    const s = createInitialState();
    startRun(s);
    s.player.invulnUntil = s.time + 1000;
    const hb = playerHitbox(s.player);
    s.obstacles.push({
      id: 5,
      kind: 'spike',
      boxes: [{ x: hb.x, y: hb.y, w: hb.w, h: hb.h }],
    });
    step(s, input());
    expect(s.status).toBe('running');
  });

  test('deterministic given the same seed', () => {
    const run = () => {
      const s = createInitialState();
      startRun(s);
      const r = createRng(42);
      for (let i = 0; i < 300; i++) step(s, { dtMs: 16.67, flip: i % 50 === 0, rng: r });
      return { distance: Math.round(s.distance), obstacles: s.obstacles.length };
    };
    expect(run()).toEqual(run());
  });
});
