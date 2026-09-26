/** Seeded PRNG (mulberry32). The only source of randomness in the pure layers. Plain JSON, so it is saved. */
export interface RngState {
  s: number;
}

export function createRng(seed: number): RngState {
  return { s: seed >>> 0 };
}

export function nextU32(rng: RngState): number {
  rng.s = (rng.s + 0x6d2b79f5) >>> 0;
  let t = rng.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (t ^ (t >>> 14)) >>> 0;
}

/** Uniform float in [0, 1). */
export function nextFloat(rng: RngState): number {
  return nextU32(rng) / 4294967296;
}

/** Uniform integer in [min, maxExclusive). */
export function nextInt(rng: RngState, min: number, maxExclusive: number): number {
  return min + Math.floor(nextFloat(rng) * (maxExclusive - min));
}
