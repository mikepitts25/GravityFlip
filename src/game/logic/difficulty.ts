import {
  BASE_SPEED,
  MAX_SPEED_MULT,
  SPAWN_INTERVAL_MIN,
  SPAWN_INTERVAL_START,
  SPAWN_RAMP_DISTANCE,
  SPEED_RAMP_DISTANCE,
} from '../constants';

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Scroll speed (px/s) grows with distance and caps at MAX_SPEED_MULT. */
export function speedFor(distance: number): number {
  const t = clamp(distance / SPEED_RAMP_DISTANCE, 0, 1);
  const mult = lerp(1, MAX_SPEED_MULT, t);
  return BASE_SPEED * mult;
}

/** Seconds between spawns, tightening as distance grows. */
export function spawnIntervalFor(distance: number): number {
  const t = clamp(distance / SPAWN_RAMP_DISTANCE, 0, 1);
  return lerp(SPAWN_INTERVAL_START, SPAWN_INTERVAL_MIN, t);
}
