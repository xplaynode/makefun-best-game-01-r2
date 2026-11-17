// The lamplighter: a small cloaked figure carrying the village's only flame.
// Movement is free (the village is open ground), oil is the real constraint.
import { PLAYER, VIEW } from './config.js';

/** Create the player at the well on the central square. */
export function createLamplighter(mods) {
  return {
    x: VIEW.width / 2, y: 428,
    vx: 0, vy: 0, facing: 1, walkPhase: 0, moving: false, running: false,
    oil: PLAYER.oilMax * mods.oilMax, oilMax: PLAYER.oilMax * mods.oilMax,
    hasFlame: true,
  };
}

/**
 * Advance the player one step. Oil drains as the lantern burns, faster at a run;
 * at the well the flask refills and a dead lantern is rekindled.
 * Returns 'refilled' or 'rekindled' when the well does its work, else null.
 */
export function stepLamplighter(player, move, dt, mods, well) {
  const speed = (move.run ? PLAYER.runSpeed : PLAYER.walkSpeed) * mods.speed;
  const length = Math.hypot(move.x, move.y) || 1;
  player.moving = move.x !== 0 || move.y !== 0;
  player.running = player.moving && move.run;
  if (player.moving) {
    player.vx = (move.x / length) * speed; player.vy = (move.y / length) * speed;
    if (move.x !== 0) player.facing = Math.sign(move.x);
    player.walkPhase += dt * (player.running ? 13 : 9);
  } else { player.vx = 0; player.vy = 0; }
  // A dead lantern makes for slow, careful feet in the dark.
  const pace = player.hasFlame ? 1 : 0.55;
  player.x = Math.min(VIEW.width - 18, Math.max(18, player.x + player.vx * pace * dt));
  player.y = Math.min(VIEW.height - 16, Math.max(34, player.y + player.vy * pace * dt));
  if (player.hasFlame) {
    player.oil -= (player.running ? PLAYER.oilDrainRun : PLAYER.oilDrainWalk) * mods.drain * dt;
    if (player.oil <= 0) { player.oil = 0; player.hasFlame = false; }
  }
  if (Math.hypot(player.x - well.x, player.y - well.y) < well.radius + 20) {
    const wasDry = !player.hasFlame;
    const wasLow = player.oil < player.oilMax * 0.99;
    player.oil = player.oilMax;
    player.hasFlame = true;
    if (wasDry) return 'rekindled';
    if (wasLow) return 'refilled';
  }
  return null;
}
