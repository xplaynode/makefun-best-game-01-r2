// Menus and end screens, painted over the village: title, how to play, pause,
// the dawn results with its upgrade choice, defeat, and victory at the tenth dawn.
import { VIEW } from './config.js';
import { drawScene } from './render.js';
import { drawHud } from './hud.js';
import { housesStanding, scoreOf } from './state.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_HOWTO = 'howto';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_DAWN = 'dawn';
export const SCREEN_DEFEAT = 'defeat';
export const SCREEN_VICTORY = 'victory';

/** Buttons painted by the last draw, for the main module's click handling. */
export let buttons = [];

function panel(ctx, x, y, w, h, alpha = 0.88) {
  ctx.fillStyle = `rgba(10,13,30,${alpha})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,184,77,0.55)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
}
function button(ctx, id, x, y, w, h, label, hot = false) {
  ctx.fillStyle = hot ? '#ffb84d' : '#232a4e';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffd98a'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
  ctx.font = '700 19px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = hot ? '#23180a' : '#f3e5c3';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  buttons.push({ id, x, y, w, h });
}
function title(ctx, text, y, size = 54) {
  ctx.font = `700 ${size}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd98a';
  ctx.shadowColor = 'rgba(255,166,66,0.65)'; ctx.shadowBlur = 22;
  ctx.fillText(text, VIEW.width / 2, y);
  ctx.shadowBlur = 0;
}
function line(ctx, text, y, size = 18, colour = '#e8e2d2') {
  ctx.font = `${size}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = colour;
  ctx.fillText(text, VIEW.width / 2, y);
}

/** Draw one screen. `ui` carries { best, muted } from the main module. */
export function drawScreen(ctx, state, screen, ui) {
  buttons = [];
  if (screen === SCREEN_PLAY) { drawScene(ctx, state); drawHud(ctx, state, ui.best, ui.muted); return; }
  if (screen === SCREEN_PAUSED) {
    drawScene(ctx, state); drawHud(ctx, state, ui.best, ui.muted);
    panel(ctx, 440, 250, 400, 220);
    title(ctx, 'Paused', 306, 38);
    line(ctx, 'The village holds its breath.', 352, 16, '#b9c2dd');
    button(ctx, 'resume', 520, 386, 240, 48, 'Resume  (P)', true);
    return;
  }
  if (screen === SCREEN_VICTORY) {
    drawScene(ctx, state, 1);
    panel(ctx, 340, 120, 600, 440, 0.82);
    title(ctx, 'The Village Shines', 182, 42);
    line(ctx, 'Ten nights kept. Every lamp burns at dawn,', 238);
    line(ctx, 'and the Gloom is only a story told to children.', 266);
    line(ctx, `Houses saved: ${housesStanding(state)} of ${state.village.houses.length}`, 322, 20, '#ffd98a');
    line(ctx, `Lamps lit across the run: ${state.stats.lampsLit}`, 356, 20, '#ffd98a');
    line(ctx, `Final score: ${scoreOf(state)}      Best: ${Math.max(ui.best, scoreOf(state))}`, 390, 20, '#ffd98a');
    button(ctx, 'again', 520, 452, 240, 52, 'Play again  (R)', true);
    return;
  }
  if (screen === SCREEN_DEFEAT) {
    drawScene(ctx, state);
    panel(ctx, 340, 140, 600, 400, 0.9);
    title(ctx, 'The Gloom Prevails', 202, 42);
    line(ctx, `On night ${state.night} the last window went black.`, 258);
    line(ctx, 'The village sleeps now under a lightless dark.', 286);
    line(ctx, `Houses standing when the night began mattered —`, 336, 16, '#b9c2dd');
    line(ctx, `lamps lit across the run: ${state.stats.lampsLit}`, 362, 18, '#ffd98a');
    line(ctx, `Score: ${scoreOf(state)}      Best: ${Math.max(ui.best, scoreOf(state))}`, 396, 20, '#ffd98a');
    button(ctx, 'again', 520, 452, 240, 52, 'Try again  (R)', true);
    return;
  }
  if (screen === SCREEN_DAWN) {
    drawScene(ctx, state, 0.65);
    const info = state.dawnInfo;
    panel(ctx, 290, 96, 700, 500, 0.9);
    title(ctx, `Dawn — Night ${info.night} Survived`, 152, 36);
    line(ctx, `Houses saved: ${info.saved} of ${info.total}`, 208, 20, '#ffd98a');
    line(ctx, `Lamps lit so far: ${info.lit}      The Gloom held back: ${info.held}% of the village`, 240, 18);
    line(ctx, `Score so far: ${scoreOf(state)}`, 272, 18);
    line(ctx, 'Choose one gift for the nights ahead:', 316, 18, '#b9c2dd');
    info.offers.forEach((offer, i) => {
      const x = 322 + i * 224;
      panel(ctx, x, 344, 208, 150, 0.95);
      ctx.font = '700 17px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffd98a';
      ctx.fillText(offer.name, x + 104, 372);
      ctx.font = '13.5px Georgia, serif'; ctx.fillStyle = '#e8e2d2';
      const words = offer.text.split(' ');
      let row = ''; let ry = 402;
      for (const word of words) {
        if ((row + ' ' + word).length > 24) { ctx.fillText(row, x + 104, ry); ry += 19; row = word; }
        else row = row ? row + ' ' + word : word;
      }
      if (row) ctx.fillText(row, x + 104, ry);
      ctx.font = '700 14px Georgia, serif'; ctx.fillStyle = '#9fb4d8';
      ctx.fillText(`press ${i + 1} or click`, x + 104, 472);
      buttons.push({ id: `upgrade-${i}`, x, y: 344, w: 208, h: 150 });
    });
    line(ctx, `Night ${info.night + 1} will be darker. Choose well.`, 540, 15, '#b9c2dd');
    return;
  }
  // Title and how-to share the dusk village behind them.
  drawScene(ctx, state, 0.25);
  if (screen === SCREEN_HOWTO) {
    panel(ctx, 330, 92, 620, 520, 0.92);
    title(ctx, 'How to Play', 142, 36);
    const rows = [
      'You are the lamplighter. The village has one flame: yours.',
      '',
      'Move with WASD or the arrow keys. Hold Shift to run.',
      'Walk into a lamp post to light it — no button to learn (E works too).',
      'Lit lamps hold the Gloom back. Unlit streets let it creep in.',
      'A house whose street stays dark too long is lost for the run.',
      'Your lantern burns oil as you walk, faster as you run.',
      'Stand at the well on the square to refill — or to rekindle',
      'if the flame has died. In the dark you walk slowly.',
      'Watch for the gust warning: wind snuffs lit lamps.',
      'Survive until dawn, choose an upgrade, and last ten nights.',
      '',
      'P or Esc pauses · M mutes · R restarts from the end screens',
    ];
    rows.forEach((text, i) => line(ctx, text, 192 + i * 27, 16.5));
    button(ctx, 'begin', 520, 540, 240, 48, 'Begin the night', true);
    return;
  }
  // Title.
  panel(ctx, 340, 118, 600, 452, 0.84);
  title(ctx, 'The Last Lamplighter', 196, 52);
  line(ctx, 'Carry the village\u2019s only flame, and keep its lamps', 262, 19);
  line(ctx, 'lit through the night while the Gloom creeps in.', 290, 19);
  line(ctx, 'WASD / arrows move · Shift runs · walk into a lamp to light it', 348, 16, '#b9c2dd');
  line(ctx, 'Refill your oil at the well · P pause · M mute', 376, 16, '#b9c2dd');
  line(ctx, 'Survive ten nights. Lose every house, and the dark wins.', 404, 16, '#b9c2dd');
  if (ui.best > 0) line(ctx, `Best score so far: ${ui.best}`, 436, 16, '#ffd98a');
  button(ctx, 'begin', 500, 466, 280, 54, 'Begin the night', true);
  button(ctx, 'howto', 540, 528, 200, 40, 'How to play');
}
