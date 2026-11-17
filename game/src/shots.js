// Deterministic screenshot scenes behind ?shot=title|play|dawn|victory&seed=<n>.
// Each scene builds a fresh game from the seed and advances it by fixed simulated
// steps — no wall clock — so the same query always draws the same frame.
import { createGame, startNight } from './state.js';
import { offerUpgrades } from './nights.js';
import { SCREEN_DAWN, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './screens.js';
import { STEP } from './config.js';

/** A simple lamplighter autopilot for the play scene: walk to the nearest dark lamp. */
function autopilot(state) {
  const p = state.player;
  if (p.oil < 30) {
    const w = state.village.well;
    return { x: Math.sign(w.x - p.x), y: Math.sign(w.y - p.y), run: false, light: false };
  }
  let best = null; let bestD = Infinity;
  for (const lamp of state.village.lamps) {
    if (lamp.lit) continue;
    const d = (lamp.x - p.x) ** 2 + (lamp.y - p.y) ** 2;
    if (d < bestD) { bestD = d; best = lamp; }
  }
  if (!best) return { x: 0, y: 0, run: false, light: false };
  return {
    x: Math.abs(best.x - p.x) > 6 ? Math.sign(best.x - p.x) : 0,
    y: Math.abs(best.y - p.y) > 6 ? Math.sign(best.y - p.y) : 0,
    run: bestD > 220 * 220, light: false,
  };
}

/** Stage the named scene on a fresh game and return the screen to draw. */
export function stageShot(name, state) {
  if (name === 'play') {
    startNight(state, 4);
    state.stats.lampsLit = 19;
    for (let i = 0; i < 21 / STEP; i += 1) {
      // stepGame is imported lazily through state to keep the module graph simple.
      if (stepOnce(state)) break;
    }
    state.gustWarn = 1.4; // the gust banner is part of the full HUD
    return SCREEN_PLAY;
  }
  if (name === 'dawn') {
    startNight(state, 3);
    state.stats.lampsLit = 34;
    for (let i = 0; i < 6 / STEP; i += 1) if (stepOnce(state)) break;
    state.dawnInfo = {
      night: 3, saved: state.village.houses.filter((h) => !h.lost).length,
      total: state.village.houses.length, lit: state.stats.lampsLit, held: 71,
      offers: offerUpgrades(3),
    };
    return SCREEN_DAWN;
  }
  if (name === 'victory') {
    startNight(state, 10);
    for (const lamp of state.village.lamps) { lamp.lit = true; lamp.fuel = lamp.maxFuel; }
    state.stats.lampsLit = 148;
    state.gloom.cells.fill(0);
    for (let i = 0; i < 2 / STEP; i += 1) state.totalTime += STEP;
    return SCREEN_VICTORY;
  }
  // Title: a few seconds of dusk over the fresh village.
  for (let i = 0; i < 3 / STEP; i += 1) if (stepOnce(state)) break;
  return SCREEN_TITLE;
}

// stepGame lives in state.js; a tiny indirection keeps imports one-directional.
import { stepGame } from './state.js';
function stepOnce(state) {
  return stepGame(state, autopilot(state), STEP) !== null;
}

export { createGame };
