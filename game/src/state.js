// The whole game state and its rules, stepped in fixed slices: lamps burn and are
// relit, oil drains and is refilled, gusts are warned then strike, houses stand in
// the light or are taken by the Gloom, and the night ends at dawn or in defeat.
import { LAMP, PLAYER } from './config.js';
import { buildVillage } from './village.js';
import { createLamplighter, stepLamplighter } from './lamplighter.js';
import { createGloom, gloomAt, gloomCoverage, stepGloom } from './gloom.js';
import { applyUpgrade, freshModifiers, nightParams, offerUpgrades } from './nights.js';
import { burst, createParticles, ember, floatText, stepParticles } from './particles.js';

/** A fresh run: night 1 about to begin, village built from the seed. */
export function createGame(random, seed) {
  const village = buildVillage(random);
  const state = {
    random, seed,
    village,
    mods: freshModifiers(),
    player: createLamplighter(freshModifiers()),
    gloom: createGloom(),
    particles: createParticles(),
    night: 1,
    params: nightParams(1),
    time: 0, // seconds into this night
    totalTime: 0,
    gustTimer: 0, gustWarn: 0, // gustWarn counts down the visible warning
    events: [], // sound cues for the main module: 'lamp', 'house', 'gust', ...
    stats: { lampsLit: 0, housesLost: 0, gusts: 0 },
    runScore: 0,
    dawnInfo: null, // filled when a night ends: { saved, lit, held, offers }
    over: false, won: false,
    emberTimer: 0,
  };
  startNight(state, 1);
  return state;
}

/** Begin a night: dusk lamps, a full flask at the well, the tide at the edges. */
export function startNight(state, night) {
  state.night = night;
  state.params = nightParams(night);
  state.time = 0;
  state.gustTimer = state.params.gustEvery ? state.params.gustEvery * 0.7 : 0;
  state.gustWarn = 0;
  state.gloom = createGloom();
  state.player = createLamplighter(state.mods);
  state.player.oilMax = PLAYER.oilMax * state.mods.oilMax;
  state.player.oil = state.player.oilMax;
  const lamps = state.village.lamps;
  lamps.forEach((lamp, i) => {
    lamp.lit = i % Math.max(2, Math.floor(lamps.length / state.params.startLit)) === 0;
    lamp.maxFuel = state.params.lampBurn;
    lamp.fuel = lamp.lit ? lamp.maxFuel * (0.5 + state.random() * 0.5) : 0;
  });
  state.dawnInfo = null;
}

/** Houses still standing. */
export function housesStanding(state) {
  return state.village.houses.filter((h) => !h.lost).length;
}

/** The run's score: houses saved across the run plus lamps lit. */
export function scoreOf(state) {
  return state.stats.lampsLit + housesStanding(state) * 10;
}

/** Light (or relight) a lamp the player is standing at, if the lantern has flame. */
function tryLight(state, lamp) {
  if (lamp.lit || !state.player.hasFlame) return;
  lamp.lit = true;
  lamp.fuel = lamp.maxFuel;
  lamp.litCount += 1;
  state.stats.lampsLit += 1;
  state.events.push('lamp');
  burst(state.particles, lamp.x, lamp.y - 18, state.random, '#ffcf7d', 16, 80);
  floatText(state.particles, lamp.x, lamp.y - 44, '+1 lamp lit');
}

/** A gust strikes: a few lit lamps go out, fewer behind wind-shield glass. */
function strikeGust(state) {
  const lit = state.village.lamps.filter((l) => l.lit);
  const count = Math.max(1, Math.round((1 + Math.floor(state.random() * 2)) * state.mods.gustShield));
  for (let i = 0; i < Math.min(count, lit.length); i += 1) {
    const lamp = lit[Math.floor(state.random() * lit.length)];
    if (lamp.lit) {
      lamp.lit = false; lamp.fuel = 0;
      burst(state.particles, lamp.x, lamp.y - 18, state.random, '#9fb4d8', 8, 50);
    }
  }
  state.stats.gusts += 1;
  state.events.push('gust');
  floatText(state.particles, state.player.x, state.player.y - 52, 'A gust snuffs the lamps!', '#bcd2f5');
}

/**
 * Advance the game one fixed step with the given movement.
 * Returns 'dawn' when the night is survived, 'defeat' when the last house falls.
 */
export function stepGame(state, move, dt) {
  state.totalTime += dt;
  state.time += dt;
  const wellEvent = stepLamplighter(state.player, move, dt, state.mods, state.village.well);
  if (wellEvent === 'rekindled') { state.events.push('refill'); floatText(state.particles, state.player.x, state.player.y - 46, 'The lantern is rekindled', '#ffd98a'); }
  else if (wellEvent === 'refilled' && state.events[state.events.length - 1] !== 'refill') state.events.push('refill');

  // Lighting is by walking into a lamp's glow circle (E does the same at range).
  for (const lamp of state.village.lamps) {
    const d = Math.hypot(lamp.x - state.player.x, lamp.y - state.player.y);
    if (d < PLAYER.relightRange || (move.light && d < PLAYER.relightRange + 22)) tryLight(state, lamp);
    if (lamp.lit) {
      lamp.fuel -= dt;
      lamp.flicker += dt * 9;
      if (lamp.fuel <= 0) { lamp.lit = false; lamp.fuel = 0; }
    }
  }

  // Gusts: a warning first (the HUD and a banner), then the strike.
  if (state.params.gustEvery > 0) {
    if (state.gustWarn > 0) {
      state.gustWarn -= dt;
      if (state.gustWarn <= 0) strikeGust(state);
    } else {
      state.gustTimer -= dt;
      if (state.gustTimer <= 0) { state.gustWarn = 2.2; state.gustTimer = state.params.gustEvery; state.events.push('gustwarn'); }
    }
  }

  stepGloom(state.gloom, state.village.lamps, state.player, state.params, dt);

  // Houses: guarded lamps lit means safety; a dark street lets the Gloom in.
  let lostAll = true;
  for (const house of state.village.houses) {
    if (house.lost) continue;
    lostAll = false;
    const cx = house.x + house.w / 2; const cy = house.y + house.h / 2;
    const guarded = house.lamps.some((l) => l.lit);
    const thick = gloomAt(state.gloom, cx, cy) > 0.55;
    if (!guarded && thick) house.darkTime += dt; else house.darkTime = Math.max(0, house.darkTime - dt * 1.6);
    house.warn = house.darkTime > LAMP.houseDarkLimit * 0.55;
    if (house.darkTime > LAMP.houseDarkLimit) {
      house.lost = true;
      state.stats.housesLost += 1;
      state.events.push('house');
      burst(state.particles, cx, cy, state.random, '#5a6480', 22, 60);
      floatText(state.particles, cx, cy - 30, 'A house is lost to the Gloom', '#e88a7a');
    }
  }
  if (lostAll || housesStanding(state) === 0) { state.over = true; return 'defeat'; }

  // Drifting embers over lit lamps.
  state.emberTimer -= dt;
  if (state.emberTimer <= 0) {
    state.emberTimer = 0.22;
    const lit = state.village.lamps.filter((l) => l.lit);
    if (lit.length) { const lamp = lit[Math.floor(state.random() * lit.length)]; ember(state.particles, lamp.x, lamp.y - 20, state.random); }
  }
  stepParticles(state.particles, dt);

  if (state.time >= state.params.seconds) {
    state.dawnInfo = {
      night: state.night,
      saved: housesStanding(state),
      total: state.village.houses.length,
      lit: state.stats.lampsLit,
      held: Math.round((1 - gloomCoverage(state.gloom)) * 100),
      offers: offerUpgrades(state.night),
    };
    return 'dawn';
  }
  return null;
}

/** Choose a dawn upgrade and begin the next night (or finish the run). */
export function chooseUpgrade(state, index) {
  const offer = state.dawnInfo?.offers[index];
  if (offer) applyUpgrade(state.mods, offer.id);
  if (state.night >= 10) { state.won = true; state.over = true; return 'victory'; }
  startNight(state, state.night + 1);
  return 'night';
}
