import { CEIL_Y, FLIP_MS, FLOOR_Y } from '../constants';
import type { Player } from '../types';
import { clamp } from './difficulty';

export function targetYFor(gravity: 'floor' | 'ceiling'): number {
  return gravity === 'floor' ? FLOOR_Y : CEIL_Y;
}

/** Begin a flip to the opposite surface. No-op if already mid-flip. */
export function startFlip(player: Player): boolean {
  if (player.isFlipping || !player.alive) return false;
  const nextGravity = player.gravity === 'floor' ? 'ceiling' : 'floor';
  player.gravity = nextGravity;
  player.isFlipping = true;
  player.flipElapsed = 0;
  player.flipFrom = player.y;
  player.flipTo = targetYFor(nextGravity);
  return true;
}

/** Ease-out cubic for a snappy-but-smooth flip. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Advance an in-progress flip by dt milliseconds, updating player.y. */
export function advanceFlip(player: Player, dtMs: number): void {
  if (!player.isFlipping) return;
  player.flipElapsed += dtMs;
  const t = clamp(player.flipElapsed / FLIP_MS, 0, 1);
  player.y = player.flipFrom + (player.flipTo - player.flipFrom) * easeOutCubic(t);
  if (t >= 1) {
    player.isFlipping = false;
    player.y = player.flipTo;
    player.flipElapsed = 0;
  }
}
