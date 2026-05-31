/**
 * Single source of truth for all gameplay tunables. Iterate on feel here.
 * Pure module — safe to import from tests and from the render layer alike.
 */

// The simulation runs in a virtual 1080x1920 portrait space and the render
// layer scales it to the device. This keeps tuning resolution-independent.
export const WORLD_W = 1080;
export const WORLD_H = 1920;

export const MARGIN = 140; // gap between a surface and the screen edge
export const PLAYER_SIZE = 96;

export const FLOOR_Y = WORLD_H - MARGIN - PLAYER_SIZE; // top-left Y on floor
export const CEIL_Y = MARGIN; // top-left Y on ceiling
export const PLAYER_X = WORLD_W * 0.22;

// Flip feel
export const FLIP_MS = 140;
export const FLIP_IFRAME_MS = 40; // collisions ignored at the very start of a flip

// Fairness: hitbox is smaller than the rendered sprite.
export const PLAYER_HITBOX_SCALE = 0.85;

// Speed / difficulty
export const BASE_SPEED = 560; // px/s in world space
export const MAX_SPEED_MULT = 2.5;
export const SPEED_RAMP_DISTANCE = 6000; // distance at which multiplier caps

export const SPAWN_INTERVAL_START = 1.2; // seconds
export const SPAWN_INTERVAL_MIN = 0.5; // seconds
export const SPAWN_RAMP_DISTANCE = 7000;

// Feature unlock thresholds (in world distance px)
export const DUAL_UNLOCK = 3000;
export const LASER_UNLOCK = 6000;

// Obstacle geometry
export const OBSTACLE_W = 90;
export const SPIKE_H = 220;
export const PILLAR_GAP = 360; // vertical opening the player passes through
export const LASER_H = 60;

// Coins
export const COIN_RADIUS = 34;
export const COIN_ROW_MIN = 3;
export const COIN_ROW_MAX = 5;
export const COIN_SPACING = 130;

// Resurrect
export const RESURRECT_INVULN_MS = 1500;

// Lane bounds (where hazards may live vertically)
export const LANE_TOP = MARGIN;
export const LANE_BOTTOM = WORLD_H - MARGIN;
