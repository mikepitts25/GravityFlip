/**
 * Small deterministic PRNG (mulberry32). Determinism lets us unit-test the
 * spawner and difficulty pacing reproducibly.
 */
export interface Rng {
  next(): number; // float in [0, 1)
  range(min: number, max: number): number;
  int(min: number, max: number): number; // inclusive
  pick<T>(items: readonly T[]): T;
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const range = (min: number, max: number) => min + next() * (max - min);
  const int = (min: number, max: number) => Math.floor(range(min, max + 1));
  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error('pick from empty list');
    return items[Math.floor(next() * items.length)] as T;
  };
  return { next, range, int, pick };
}
