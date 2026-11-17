// Tuning for The Last Lamplighter: one village, one screen, ten nights.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const BEST_KEY = 'last-lamplighter-best';
export const TOTAL_NIGHTS = 10;
export const NIGHT_SECONDS = 78;
export const PLAYER = {
  radius: 13,
  walkSpeed: 148,
  runSpeed: 232,
  oilMax: 100,
  oilDrainWalk: 1.55, // oil per second while carrying the lantern
  oilDrainRun: 2.9,
  oilDrainDry: 0,
  relightRange: 46, // walk into a lamp's glow circle to light it
  lanternRadius: 74, // the glow the player carries
};
export const LAMP = {
  glowRadius: 86,
  houseDarkLimit: 16, // seconds a house street may stay dark before the Gloom takes it
};
export const GLOOM = { cell: 40, cols: 32, rows: 18 };
export const COLOUR = {
  night: '#141a38',
  nightDeep: '#0b0f26',
  street: '#2c3358',
  streetEdge: '#3a4170',
  roof: '#4a2f3d',
  amber: '#ffb84d',
  amberBright: '#ffd98a',
  flame: '#fff3c4',
  gloom: '#05060f',
  parchment: '#f3e5c3',
};
