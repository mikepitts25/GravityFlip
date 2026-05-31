import { COIN_RADIUS, PLAYER_HITBOX_SCALE, PLAYER_SIZE } from '../constants';
import type { Box, Coin, Player } from '../types';

export function boxesOverlap(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/** Player hitbox, shrunk from the sprite for fairness and centered on it. */
export function playerHitbox(player: Player): Box {
  const size = PLAYER_SIZE * PLAYER_HITBOX_SCALE;
  const inset = (PLAYER_SIZE - size) / 2;
  return { x: player.x + inset, y: player.y + inset, w: size, h: size };
}

/** Circle (coin) vs rect (player hitbox) overlap. */
export function coinHitsPlayer(coin: Coin, player: Player): boolean {
  const hb = playerHitbox(player);
  const cx = Math.max(hb.x, Math.min(coin.x, hb.x + hb.w));
  const cy = Math.max(hb.y, Math.min(coin.y, hb.y + hb.h));
  const dx = coin.x - cx;
  const dy = coin.y - cy;
  return dx * dx + dy * dy <= COIN_RADIUS * COIN_RADIUS;
}
