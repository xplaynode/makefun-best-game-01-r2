// Particles and floating texts: lamp-lighting bursts, drifting embers over lit lamps,
// smoke where the Gloom takes a house, and little score notes that float up and fade.
/** Create an empty particle system. */
export function createParticles() {
  return { items: [], texts: [] };
}

/** A burst of sparks at a point (a lamp catching, a house lost, dawn). */
export function burst(particles, x, y, random, colour, count = 14, speed = 70) {
  for (let i = 0; i < count; i += 1) {
    const angle = random() * Math.PI * 2; const pace = speed * (0.3 + random() * 0.9);
    particles.items.push({
      x, y, vx: Math.cos(angle) * pace, vy: Math.sin(angle) * pace - 24,
      life: 0, maxLife: 0.5 + random() * 0.6, size: 1.5 + random() * 2.4, colour,
    });
  }
}

/** One slow ember rising off a lit lamp. */
export function ember(particles, x, y, random) {
  particles.items.push({
    x: x + (random() - 0.5) * 10, y, vx: (random() - 0.5) * 8, vy: -12 - random() * 14,
    life: 0, maxLife: 1.4 + random() * 1.4, size: 1 + random() * 1.6, colour: '#ffcf7d',
  });
}

/** A floating note: '+1 lamp lit', 'A house is lost', and the like. */
export function floatText(particles, x, y, text, colour = '#ffd98a') {
  particles.texts.push({ x, y, text, colour, life: 0, maxLife: 1.6 });
}

/** Advance particles and texts; dead ones are dropped. */
export function stepParticles(particles, dt) {
  for (const p of particles.items) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 12 * dt; }
  particles.items = particles.items.filter((p) => p.life < p.maxLife);
  for (const t of particles.texts) { t.life += dt; t.y -= 22 * dt; }
  particles.texts = particles.texts.filter((t) => t.life < t.maxLife);
}

/** Paint particles and floating texts. */
export function drawParticles(ctx, particles) {
  for (const p of particles.items) {
    ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
    ctx.fillStyle = p.colour;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  for (const t of particles.texts) {
    ctx.globalAlpha = Math.max(0, 1 - t.life / t.maxLife);
    ctx.font = '600 15px Georgia, serif';
    ctx.fillStyle = t.colour;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}
