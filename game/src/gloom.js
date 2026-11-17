// The Gloom: a grid of darkness over the village. It seeps in from the edges and
// along streets whose lamps are out, and it retreats wherever lamplight falls.
// A house is taken when the Gloom sits thick on it for long enough.
import { GLOOM, LAMP } from './config.js';

/** A fresh grid: darkness already pooled at the map edges. */
export function createGloom() {
  const cells = new Float32Array(GLOOM.cols * GLOOM.rows);
  for (let y = 0; y < GLOOM.rows; y += 1) for (let x = 0; x < GLOOM.cols; x += 1) {
    const edge = Math.min(x, y, GLOOM.cols - 1 - x, GLOOM.rows - 1 - y);
    cells[y * GLOOM.cols + x] = edge === 0 ? 0.85 : edge === 1 ? 0.35 : 0;
  }
  return { cells };
}

/** Darkness (0..1) at a world point, from the cell that holds it. */
export function gloomAt(gloom, x, y) {
  const cx = Math.min(GLOOM.cols - 1, Math.max(0, Math.floor(x / GLOOM.cell)));
  const cy = Math.min(GLOOM.rows - 1, Math.max(0, Math.floor(y / GLOOM.cell)));
  return gloom.cells[cy * GLOOM.cols + cx];
}

/** Advance the tide one step against the lamps and the player's lantern. */
export function stepGloom(gloom, lamps, player, params, dt) {
  const { cells } = gloom;
  const next = new Float32Array(cells);
  for (let y = 0; y < GLOOM.rows; y += 1) for (let x = 0; x < GLOOM.cols; x += 1) {
    const i = y * GLOOM.cols + x;
    const wx = x * GLOOM.cell + GLOOM.cell / 2; const wy = y * GLOOM.cell + GLOOM.cell / 2;
    let light = 0;
    for (const lamp of lamps) {
      if (!lamp.lit) continue;
      const d = Math.hypot(lamp.x - wx, lamp.y - wy);
      if (d < LAMP.glowRadius + 30) light = Math.max(light, 1 - d / (LAMP.glowRadius + 30));
    }
    if (player.hasFlame) {
      const d = Math.hypot(player.x - wx, player.y - wy);
      if (d < 110) light = Math.max(light, 1 - d / 110);
    }
    // Pressure flows in from darker neighbours, so unlit streets carry the tide.
    let neighbour = 0;
    if (x > 0) neighbour = Math.max(neighbour, cells[i - 1]);
    if (x < GLOOM.cols - 1) neighbour = Math.max(neighbour, cells[i + 1]);
    if (y > 0) neighbour = Math.max(neighbour, cells[i - GLOOM.cols]);
    if (y < GLOOM.rows - 1) neighbour = Math.max(neighbour, cells[i + GLOOM.cols]);
    let value = cells[i];
    if (light > 0.25) value -= params.gloomRetreat * light * dt;
    else value += params.gloomRate * (0.35 + neighbour) * dt;
    next[i] = Math.min(1, Math.max(0, value));
  }
  gloom.cells.set(next);
}

/** How much of the village the Gloom currently holds, 0..1 (for score and HUD). */
export function gloomCoverage(gloom) {
  let sum = 0;
  for (const value of gloom.cells) sum += value;
  return sum / gloom.cells.length;
}
