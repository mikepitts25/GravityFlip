/**
 * Core game types. This module is pure (no React Native imports) so the
 * entire simulation can be unit-tested in a plain Node environment.
 */

export type Gravity = 'floor' | 'ceiling';

export type ObstacleKind =
  | 'spike' // mounted on floor; requires being on ceiling
  | 'stalactite' // mounted on ceiling; requires being on floor
  | 'pillar' // spans most of the lane with a gap to pass through
  | 'dual' // floor + ceiling hazard; survivable surface depends on gap
  | 'laser'; // mid-lane beam; aligned with one surface

/** Axis-aligned bounding box in screen pixels (origin top-left). */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Player {
  x: number;
  y: number; // current rendered Y (interpolated during a flip)
  gravity: Gravity;
  isFlipping: boolean;
  flipElapsed: number; // ms since the current flip started
  flipFrom: number; // Y at flip start
  flipTo: number; // Y target
  alive: boolean;
  invulnUntil: number; // sim-time (ms) until which collisions are ignored
}

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  /** One or more solid boxes that make up the hazard. */
  boxes: Box[];
}

export interface Coin {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

export interface GameState {
  time: number; // accumulated sim time in ms
  distance: number; // pixels travelled (the score)
  speed: number; // current scroll speed in px/s
  spawnTimer: number; // ms until next spawn
  player: Player;
  obstacles: Obstacle[];
  coins: Coin[];
  coinsCollected: number;
  status: 'ready' | 'running' | 'dead';
  nextId: number;
  usedResurrect: boolean;
}

/** Events surfaced by a single simulation step for the view layer to react to. */
export interface StepEvents {
  died: boolean;
  flipped: boolean;
  coinsPickedThisStep: number;
}
