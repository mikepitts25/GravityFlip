import {
  CEIL_Y,
  COIN_RADIUS,
  COIN_ROW_MAX,
  COIN_ROW_MIN,
  COIN_SPACING,
  DUAL_UNLOCK,
  FLOOR_Y,
  LANE_BOTTOM,
  LANE_TOP,
  LASER_H,
  LASER_UNLOCK,
  OBSTACLE_W,
  PILLAR_GAP,
  PLAYER_SIZE,
  SPIKE_H,
  WORLD_W,
} from '../constants';
import type { Coin, Obstacle, ObstacleKind } from '../types';
import type { Rng } from './rng';

interface WeightedKind {
  kind: ObstacleKind;
  weight: number;
}

/** Spawn weights shift as the run progresses and new hazards unlock. */
export function weightsFor(distance: number): WeightedKind[] {
  const list: WeightedKind[] = [
    { kind: 'spike', weight: 5 },
    { kind: 'stalactite', weight: 4 },
    { kind: 'pillar', weight: 3 },
  ];
  if (distance >= DUAL_UNLOCK) list.push({ kind: 'dual', weight: 4 });
  if (distance >= LASER_UNLOCK) list.push({ kind: 'laser', weight: 2 });
  return list;
}

export function pickKind(distance: number, rng: Rng): ObstacleKind {
  const weights = weightsFor(distance);
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let roll = rng.next() * total;
  for (const w of weights) {
    roll -= w.weight;
    if (roll <= 0) return w.kind;
  }
  return weights[0]!.kind;
}

const floorTop = FLOOR_Y + PLAYER_SIZE; // y of the floor surface line
const ceilBottom = CEIL_Y; // y of the ceiling surface line

/** Build an obstacle of a given kind at the right edge of the world. */
export function makeObstacle(id: number, kind: ObstacleKind, rng: Rng): Obstacle {
  const x = WORLD_W + OBSTACLE_W;
  switch (kind) {
    case 'spike':
      return {
        id,
        kind,
        boxes: [{ x, y: LANE_BOTTOM - SPIKE_H, w: OBSTACLE_W, h: SPIKE_H }],
      };
    case 'stalactite':
      return {
        id,
        kind,
        boxes: [{ x, y: LANE_TOP, w: OBSTACLE_W, h: SPIKE_H }],
      };
    case 'pillar': {
      // A vertical wall with a single gap; gap sits nearer one surface.
      const gapTop = rng.range(LANE_TOP + 80, LANE_BOTTOM - PILLAR_GAP - 80);
      return {
        id,
        kind,
        boxes: [
          { x, y: LANE_TOP, w: OBSTACLE_W, h: gapTop - LANE_TOP },
          {
            x,
            y: gapTop + PILLAR_GAP,
            w: OBSTACLE_W,
            h: LANE_BOTTOM - (gapTop + PILLAR_GAP),
          },
        ],
      };
    }
    case 'dual': {
      // Hazard on both surfaces; the safe surface is chosen at random and the
      // player must be there. Heights leave a passable band on one side only.
      const safeFloor = rng.next() < 0.5;
      const bigH = SPIKE_H + 80;
      const smallH = 120;
      return {
        id,
        kind,
        boxes: [
          {
            x,
            y: LANE_TOP,
            w: OBSTACLE_W,
            h: safeFloor ? bigH : smallH,
          },
          {
            x,
            y: LANE_BOTTOM - (safeFloor ? smallH : bigH),
            w: OBSTACLE_W,
            h: safeFloor ? smallH : bigH,
          },
        ],
      };
    }
    case 'laser': {
      // Mid-lane beam aligned just off one surface; flip to the other to pass.
      const nearFloor = rng.next() < 0.5;
      const y = nearFloor ? floorTop - SPIKE_H : ceilBottom + SPIKE_H - LASER_H;
      return {
        id,
        kind,
        boxes: [{ x, y, w: OBSTACLE_W * 2.2, h: LASER_H }],
      };
    }
  }
}

/** Optionally produce a row of coins along a safe-looking path. */
export function maybeMakeCoins(
  startId: number,
  rng: Rng,
): { coins: Coin[]; idsUsed: number } {
  if (rng.next() > 0.55) return { coins: [], idsUsed: 0 };
  const count = rng.int(COIN_ROW_MIN, COIN_ROW_MAX);
  const onFloor = rng.next() < 0.5;
  const y = onFloor ? FLOOR_Y + PLAYER_SIZE / 2 : CEIL_Y + PLAYER_SIZE / 2;
  const coins: Coin[] = [];
  for (let i = 0; i < count; i++) {
    coins.push({
      id: startId + i,
      x: WORLD_W + COIN_RADIUS + i * COIN_SPACING,
      y,
      collected: false,
    });
  }
  return { coins, idsUsed: count };
}

export { COIN_RADIUS };
