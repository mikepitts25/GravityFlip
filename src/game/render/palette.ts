/** Flat-neon / synthwave palette shared across the render layer. */
export const palette = {
  bgTop: '#0a0a1f',
  bgBottom: '#1a0b2e',
  grid: '#2a1a4a',
  surface: '#3a2a6a',
  hazard: '#ff2e63',
  hazardGlow: '#ff2e63',
  laser: '#ff5bd1',
  coin: '#ffd23f',
  coinGlow: '#ffe97f',
  text: '#eaeaff',
  textDim: '#9a9ac0',
  accent: '#27e8ff',
};

export const obstacleColor = (kind: string): string =>
  kind === 'laser' ? palette.laser : palette.hazard;
