// A small seeded generator (mulberry32): the same seed always gives the same village,
// the same gusts and the same screenshot scenes.
/** Create a deterministic random function returning values in [0, 1). */
export function createRandom(seed) {
  let a = seed | 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Pick one item from a list with the seeded generator. */
export function pick(random, list) {
  return list[Math.min(list.length - 1, Math.floor(random() * list.length))];
}
/** A seeded value between low and high. */
export function range(random, low, high) {
  return low + random() * (high - low);
}
