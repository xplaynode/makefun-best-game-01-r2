// The heads-up display: night and dawn progress, houses standing, lamps lit,
// the oil meter (the game's real clock), score, and the gust warning banner.
import { VIEW } from './config.js';
import { housesStanding, scoreOf } from './state.js';

/** Paint the HUD over the night scene. */
export function drawHud(ctx, state, best, muted) {
  ctx.fillStyle = 'rgba(8,10,24,0.78)';
  ctx.fillRect(0, 0, VIEW.width, 44);
  ctx.strokeStyle = 'rgba(255,184,77,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 44.5); ctx.lineTo(VIEW.width, 44.5); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = '700 19px Georgia, serif'; ctx.fillStyle = '#ffd98a';
  ctx.fillText(`Night ${state.night} of 10`, 16, 23);
  // Time to dawn.
  const progress = Math.min(1, state.time / state.params.seconds);
  ctx.fillStyle = '#2c3358'; ctx.fillRect(178, 15, 170, 14);
  ctx.fillStyle = '#ffb84d'; ctx.fillRect(178, 15, 170 * progress, 14);
  ctx.font = '12px Georgia, serif'; ctx.fillStyle = '#cdd6f4';
  ctx.fillText('until dawn', 356, 23);
  // Houses and lamps.
  const standing = housesStanding(state);
  ctx.font = '600 16px Georgia, serif'; ctx.fillStyle = standing <= 3 ? '#ff9a7a' : '#f3e5c3';
  ctx.fillText(`Houses ${standing}/${state.village.houses.length}`, 448, 23);
  const lit = state.village.lamps.filter((l) => l.lit).length;
  ctx.fillStyle = '#f3e5c3';
  ctx.fillText(`Lamps ${lit}/${state.village.lamps.length}`, 592, 23);
  ctx.fillText(`Score ${scoreOf(state)}`, 724, 23);
  ctx.fillStyle = '#9fb4d8';
  ctx.fillText(`Best ${Math.max(best, scoreOf(state))}`, 838, 23);
  // Oil meter: the lantern's life, flashing when low, empty when the flame is out.
  ctx.font = '600 14px Georgia, serif'; ctx.fillStyle = '#f3e5c3';
  ctx.fillText(state.player.hasFlame ? 'Oil' : 'Oil — DRY! Reach the well', 966, 23);
  const oilW = 190;
  ctx.fillStyle = '#2c3358'; ctx.fillRect(1074, 14, oilW, 16);
  const frac = state.player.oil / state.player.oilMax;
  ctx.fillStyle = frac < 0.25 && Math.floor(state.totalTime * 4) % 2 === 0 ? '#ff7a5c' : '#ffb84d';
  if (state.player.hasFlame) ctx.fillRect(1074, 14, oilW * frac, 16);
  ctx.strokeStyle = 'rgba(243,229,195,0.5)'; ctx.strokeRect(1074, 14, oilW, 16);
  ctx.font = '13px Georgia, serif'; ctx.fillStyle = muted ? '#ff9a7a' : '#9fb4d8';
  ctx.textAlign = 'right';
  ctx.fillText(muted ? 'M muted' : 'M sound on', VIEW.width - 12, 60);
  ctx.textAlign = 'left';
  // Gust warning banner.
  if (state.gustWarn > 0) {
    ctx.fillStyle = 'rgba(30,40,80,0.85)';
    ctx.fillRect(VIEW.width / 2 - 190, 56, 380, 34);
    ctx.strokeStyle = '#9fb4d8'; ctx.strokeRect(VIEW.width / 2 - 190, 56, 380, 34);
    ctx.font = '700 17px Georgia, serif'; ctx.fillStyle = '#bcd2f5'; ctx.textAlign = 'center';
    ctx.fillText('A gust is rising — lamps will be snuffed!', VIEW.width / 2, 74);
    ctx.textAlign = 'left';
  }
}
