// The village painted in code on the canvas: indigo night, cobbled streets, houses
// with warm windows, lamp posts blooming gold, the Gloom as a smoky dark tide,
// fog on the late nights, and the lamplighter with his lantern.
import { COLOUR, GLOOM, LAMP, PLAYER, VIEW } from './config.js';
import { H_STREETS, STREET_HALF, V_STREETS } from './village.js';
import { drawParticles } from './particles.js';

function glow(ctx, x, y, radius, alpha) {
  const grad = ctx.createRadialGradient(x, y, 2, x, y, radius);
  grad.addColorStop(0, `rgba(255,196,92,${alpha})`);
  grad.addColorStop(0.55, `rgba(255,166,66,${alpha * 0.38})`);
  grad.addColorStop(1, 'rgba(255,166,66,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawStreets(ctx, village) {
  ctx.fillStyle = COLOUR.street;
  for (const y of H_STREETS) ctx.fillRect(0, y - STREET_HALF, VIEW.width, STREET_HALF * 2);
  for (const x of V_STREETS) ctx.fillRect(x - STREET_HALF, 0, STREET_HALF * 2, VIEW.height);
  ctx.fillStyle = '#39406a';
  ctx.fillRect(VIEW.width / 2 - 92, 258, 184, 184); // the square
  // Cobbles: a quiet dotted pattern along the streets.
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let x = 18; x < VIEW.width; x += 36) for (const y of H_STREETS) {
    ctx.beginPath(); ctx.arc(x + (y % 3) * 7, y - 12 + (x % 5) * 5, 3, 0, Math.PI * 2); ctx.fill();
  }
  // The well at the square's heart.
  const well = village.well;
  ctx.fillStyle = '#59617f'; ctx.beginPath(); ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#232a4a'; ctx.beginPath(); ctx.arc(well.x, well.y, well.radius - 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#7a6a4f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(well.x - 22, well.y - 20); ctx.lineTo(well.x, well.y - 44); ctx.lineTo(well.x + 22, well.y - 20); ctx.stroke();
  ctx.fillStyle = COLOUR.amber; ctx.beginPath(); ctx.arc(well.x, well.y - 46, 3.5, 0, Math.PI * 2); ctx.fill();
}

function drawHouse(ctx, house, time) {
  const { x, y, w, h } = house;
  ctx.fillStyle = house.lost ? '#23222e' : house.wall;
  ctx.fillRect(x, y + 14, w, h - 14);
  ctx.fillStyle = house.lost ? '#191922' : house.roof;
  ctx.beginPath();
  ctx.moveTo(x - 5, y + 16); ctx.lineTo(x + w / 2, y - 8); ctx.lineTo(x + w + 5, y + 16); ctx.closePath(); ctx.fill();
  if (house.chimney && !house.lost) {
    ctx.fillStyle = '#3a3040'; ctx.fillRect(x + w - 26, y - 12, 10, 16);
  }
  // Windows glow while the house is safe; black once it is lost.
  const cols = Math.max(2, Math.floor(w / 34));
  for (let i = 0; i < cols; i += 1) {
    const wx = x + 14 + i * ((w - 26) / Math.max(1, cols - 1)) - 5;
    const wy = y + 26;
    if (house.lost) ctx.fillStyle = '#0a0a12';
    else ctx.fillStyle = (i + Math.floor(time)) % 7 === 3 ? '#e8a04c' : COLOUR.amberBright;
    ctx.fillRect(wx, wy, 10, 13);
  }
  ctx.fillStyle = house.lost ? '#101018' : '#4c3a28';
  ctx.fillRect(x + w / 2 - 7, y + h - 22, 14, 22);
  if (house.warn && !house.lost) {
    // A warning mark pulses over a house whose street has been dark too long.
    const pulse = 0.6 + 0.4 * Math.sin(time * 6);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ff7a5c';
    ctx.font = '700 22px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('!', x + w / 2, y - 16);
    ctx.globalAlpha = 1;
  }
}

function drawLamp(ctx, lamp, time) {
  ctx.strokeStyle = '#1c1f30'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(lamp.x, lamp.y + 16); ctx.lineTo(lamp.x, lamp.y - 14); ctx.stroke();
  ctx.fillStyle = '#1c1f30'; ctx.fillRect(lamp.x - 6, lamp.y - 22, 12, 10);
  if (lamp.lit) {
    const fade = Math.min(1, lamp.fuel / 4); // flicker as the fuel runs low
    const flicker = lamp.fuel < 5 ? 0.72 + 0.28 * Math.sin(lamp.flicker * 3.1) * Math.sin(lamp.flicker * 7.7) : 1;
    glow(ctx, lamp.x, lamp.y - 17, LAMP.glowRadius, 0.5 * fade * flicker + 0.12);
    ctx.fillStyle = COLOUR.flame;
    ctx.beginPath(); ctx.arc(lamp.x, lamp.y - 17, 3.6, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#39405e'; ctx.beginPath(); ctx.arc(lamp.x, lamp.y - 17, 3, 0, Math.PI * 2); ctx.fill();
  }
}

function drawGloom(ctx, state) {
  const { cells } = state.gloom;
  for (let y = 0; y < GLOOM.rows; y += 1) for (let x = 0; x < GLOOM.cols; x += 1) {
    const v = cells[y * GLOOM.cols + x];
    if (v < 0.04) continue;
    const wx = x * GLOOM.cell; const wy = y * GLOOM.cell;
    ctx.fillStyle = `rgba(4,5,13,${(v * 0.82).toFixed(3)})`;
    ctx.fillRect(wx, wy, GLOOM.cell + 1, GLOOM.cell + 1);
    // Smoky tongues licking inward where the tide is thick.
    if (v > 0.6) {
      ctx.fillStyle = `rgba(10,11,24,${((v - 0.6) * 0.8).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(wx + 20 + Math.sin(state.totalTime * 0.7 + x * 1.7 + y) * 6, wy + 20, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPlayer(ctx, player, time, glowScale) {
  if (player.hasFlame) glow(ctx, player.x, player.y, PLAYER.lanternRadius * glowScale, 0.42);
  const bob = player.moving ? Math.sin(player.walkPhase) * 2 : Math.sin(time * 2) * 0.7;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(player.x, player.y + 15, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
  // Cloak and hood.
  ctx.fillStyle = '#31556e';
  ctx.beginPath();
  ctx.moveTo(player.x - 11, player.y + 14);
  ctx.quadraticCurveTo(player.x - 12, player.y - 8 + bob, player.x, player.y - 15 + bob);
  ctx.quadraticCurveTo(player.x + 12, player.y - 8 + bob, player.x + 11, player.y + 14);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8c39a';
  ctx.beginPath(); ctx.arc(player.x, player.y - 12 + bob, 5.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#274b63';
  ctx.beginPath(); ctx.arc(player.x, player.y - 14 + bob, 6.4, Math.PI, Math.PI * 2); ctx.fill();
  // The lantern, held out on the facing side.
  const lx = player.x + player.facing * 14; const ly = player.y + 1 + bob;
  ctx.strokeStyle = '#10121f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(player.x + player.facing * 6, player.y - 4 + bob); ctx.lineTo(lx, ly); ctx.stroke();
  ctx.fillStyle = '#10121f'; ctx.fillRect(lx - 4, ly - 6, 8, 11);
  ctx.fillStyle = player.hasFlame ? COLOUR.flame : '#39405e';
  ctx.beginPath(); ctx.arc(lx, ly, 2.8, 0, Math.PI * 2); ctx.fill();
}

/** Paint the whole night scene (no HUD, no menus). `dawnMix` 0..1 lightens the sky. */
export function drawScene(ctx, state, dawnMix = 0) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  if (dawnMix > 0) {
    sky.addColorStop(0, '#5a5f8f'); sky.addColorStop(0.6, '#8a6a7a'); sky.addColorStop(1, '#c98d5f');
  } else { sky.addColorStop(0, COLOUR.nightDeep); sky.addColorStop(1, COLOUR.night); }
  ctx.fillStyle = sky; ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Stars (seeded positions, so every frame and screenshot agrees).
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 46; i += 1) {
    const sx = (i * 173) % VIEW.width; const sy = (i * 97) % 120;
    ctx.globalAlpha = dawnMix > 0 ? 0.12 : 0.25 + 0.2 * Math.sin(state.totalTime + i);
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1d2447'; ctx.fillRect(0, 30, VIEW.width, VIEW.height - 30); // ground
  drawStreets(ctx, state.village);
  for (const tree of state.village.trees) {
    ctx.fillStyle = '#16283a';
    ctx.beginPath(); ctx.arc(tree.x, tree.y, tree.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1d364e';
    ctx.beginPath(); ctx.arc(tree.x - 3, tree.y - 3, tree.r * 0.6, 0, Math.PI * 2); ctx.fill();
  }
  for (const house of state.village.houses) drawHouse(ctx, house, state.totalTime);
  drawGloom(ctx, state);
  for (const lamp of state.village.lamps) drawLamp(ctx, lamp, state.totalTime);
  drawPlayer(ctx, state.player, state.totalTime, state.mods.glow);
  drawParticles(ctx, state.particles);
  // Fog on the late nights: soft pale bands drifting over the streets.
  if (state.params.fog > 0) {
    ctx.fillStyle = `rgba(190,200,225,${(state.params.fog * 0.16).toFixed(3)})`;
    for (let i = 0; i < 4; i += 1) {
      const fy = 90 + i * 160 + Math.sin(state.totalTime * 0.3 + i * 2) * 14;
      ctx.fillRect(0, fy, VIEW.width, 52);
    }
  }
  // The night closes in at the edges when the Gloom is thick near a house.
  const threatened = state.village.houses.some((h) => h.warn && !h.lost);
  if (threatened) {
    const pulse = 0.24 + 0.13 * Math.sin(state.totalTime * 5);
    const edge = ctx.createRadialGradient(640, 360, 300, 640, 360, 720);
    edge.addColorStop(0, 'rgba(120,20,10,0)');
    edge.addColorStop(1, `rgba(120,20,10,${pulse.toFixed(3)})`);
    ctx.fillStyle = edge; ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
}
