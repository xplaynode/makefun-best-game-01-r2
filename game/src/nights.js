// The ten nights: each one burns lamps faster, pushes the Gloom harder, gusts more
// often and (late on) folds fog over the streets. Survive all ten to win.
import { NIGHT_SECONDS, TOTAL_NIGHTS } from './config.js';

/** Difficulty for a night, 1-based. */
export function nightParams(night) {
  const t = (night - 1) / (TOTAL_NIGHTS - 1);
  return {
    night,
    seconds: NIGHT_SECONDS,
    lampBurn: 34 - 15 * t, // seconds a lit lamp lasts, night 1 to night 10
    gloomRate: 0.055 + 0.085 * t, // how fast dark cells fill
    gloomRetreat: 0.16 - 0.05 * t,
    gustEvery: night < 2 ? 0 : 21 - 9 * t, // 0 means no gusts yet
    fog: night < 6 ? 0 : (night - 5) / 5 * 0.55,
    startLit: Math.max(3, 7 - Math.floor(night / 2)), // lamps already burning at dusk
  };
}

/** The upgrade pool: after each dawn the player picks one of three offered. */
export const UPGRADES = [
  { id: 'feet', name: 'Swifter Feet', text: 'Walk and run 15% faster on the rounds.' },
  { id: 'bright', name: 'Brighter Lantern', text: 'Your carried glow grows wider and steadies the lamps near you.' },
  { id: 'thick', name: 'Thicker Oil', text: 'The lantern burns its oil 25% slower.' },
  { id: 'flask', name: 'A Larger Flask', text: 'Carry 40% more oil between visits to the well.' },
  { id: 'shield', name: 'Wind-Shield Glass', text: 'Gusts snuff half as many lamps (rounded down).' },
];

/** Three distinct upgrades offered after a night, rotating with the night number. */
export function offerUpgrades(night) {
  const out = [];
  for (let i = 0; i < 3; i += 1) out.push(UPGRADES[(night + i * 2 - 1) % UPGRADES.length]);
  return out;
}

/** A fresh set of player modifiers, changed by the upgrades chosen. */
export function freshModifiers() {
  return { speed: 1, glow: 1, drain: 1, oilMax: 1, gustShield: 1 };
}

/** Apply one chosen upgrade to the modifiers. */
export function applyUpgrade(mods, id) {
  if (id === 'feet') mods.speed *= 1.15;
  else if (id === 'bright') mods.glow *= 1.3;
  else if (id === 'thick') mods.drain *= 0.75;
  else if (id === 'flask') mods.oilMax *= 1.4;
  else if (id === 'shield') mods.gustShield *= 0.5;
  return mods;
}
