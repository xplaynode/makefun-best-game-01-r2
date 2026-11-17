// The village layout: cobbled streets on a grid, houses between them, lamp posts along
// the streets and a well on the central square. Built once per run from the run's seed,
// so a seed always builds the same village.
import { VIEW } from './config.js';
import { range } from './random.js';

export const WELL = { x: VIEW.width / 2, y: 350, radius: 30 };
export const H_STREETS = [168, 350, 532]; // y centres of the east-west streets
export const V_STREETS = [248, 640, 1032]; // x centres of the north-south streets
export const STREET_HALF = 27;

/** Is a point on a street or the central square (where the player may walk freely)? */
export function onStreet(x, y) {
  if (Math.abs(x - WELL.x) < 92 && Math.abs(y - WELL.y) < 92) return true;
  return H_STREETS.some((sy) => Math.abs(y - sy) < STREET_HALF)
    || V_STREETS.some((sx) => Math.abs(x - sx) < STREET_HALF);
}

const ROOFS = ['#5a3442', '#46345c', '#6b4136', '#3d4a68', '#59384f'];
const WALLS = ['#8a7a68', '#7d7268', '#96836f', '#84766b'];

/** Build houses, lamps and decorative trees for one run. */
export function buildVillage(random) {
  const houses = [];
  // House plots sit in the blocks between streets, two rows per block band.
  const bands = [
    { y: 62, h: 62 }, { y: 232, h: 58 }, { y: 414, h: 58 }, { y: 596, h: 62 },
  ];
  const slots = [56, 356, 756, 1112];
  for (const band of bands) {
    for (const sx of slots) {
      const w = 104 + Math.floor(range(random, 0, 26));
      const x = sx + Math.floor(range(random, -8, 10));
      if (Math.abs(x + w / 2 - WELL.x) < 130 && Math.abs(band.y - WELL.y) < 130) continue;
      houses.push({
        x, y: band.y, w, h: band.h,
        roof: ROOFS[Math.floor(random() * ROOFS.length)],
        wall: WALLS[Math.floor(random() * WALLS.length)],
        chimney: random() > 0.45,
        lost: false, darkTime: 0, warn: false,
        lamps: [], // filled below: the lamps that guard this house's street
      });
    }
  }
  const lamps = [];
  const addLamp = (x, y) => lamps.push({
    x, y, lit: false, fuel: 0, maxFuel: 1, flicker: random() * 10, litCount: 0,
  });
  for (const sy of H_STREETS) for (const x of [108, 420, 640, 860, 1172]) addLamp(x, sy - 34);
  for (const sx of V_STREETS) for (const y of [84, 350, 616]) {
    if (!H_STREETS.some((sy) => Math.abs(y - sy) < 60)) addLamp(sx + 34, y);
  }
  // Each house is guarded by its two nearest lamps.
  for (const house of houses) {
    const cx = house.x + house.w / 2; const cy = house.y + house.h / 2;
    house.lamps = lamps
      .map((lamp) => ({ lamp, d: (lamp.x - cx) ** 2 + (lamp.y - cy) ** 2 }))
      .sort((a, b) => a.d - b.d).slice(0, 2).map((entry) => entry.lamp);
  }
  const trees = [];
  for (let i = 0; i < 16; i += 1) {
    const x = range(random, 30, VIEW.width - 30); const y = range(random, 40, VIEW.height - 30);
    if (!onStreet(x, y) && Math.hypot(x - WELL.x, y - WELL.y) > 120) trees.push({ x, y, r: range(random, 12, 20) });
  }
  return { houses, lamps, trees, well: { ...WELL } };
}
