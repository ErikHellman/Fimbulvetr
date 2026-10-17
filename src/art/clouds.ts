import { createRng, nextFloat } from '@core/math/rng';
import { createRaster, type Raster } from './raster';

/** The cloud-shadow texture is square and tiles in both directions, so the shell can scroll it forever. */
export const CLOUD_SIZE = 256;
/** The darkest a cloud's shadow gets (alpha out of 255). */
const DEEPEST = 88;
/** Fraction of the sky under cloud: alpha is 0 below this noise level and ramps up over `RAMP` above it. */
const COVER = 0.55;
const RAMP = 0.3;
const SHADE_RGB: readonly [number, number, number] = [14, 12, 36];

/** Smoothstep-interpolated, wrapping value noise on a lattice of `cells` points per side. */
function valueNoise(seed: number, cells: number): (x: number, y: number) => number {
  const rng = createRng(seed);
  const lattice = new Float32Array(cells * cells);
  for (let i = 0; i < lattice.length; i++) lattice[i] = nextFloat(rng);
  const at = (i: number, j: number): number =>
    lattice[(((j % cells) + cells) % cells) * cells + (((i % cells) + cells) % cells)] ?? 0;
  const fade = (t: number): number => t * t * (3 - 2 * t);
  return (x, y) => {
    const gx = x * cells;
    const gy = y * cells;
    const i = Math.floor(gx);
    const j = Math.floor(gy);
    const fx = fade(gx - i);
    const fy = fade(gy - j);
    const top = at(i, j) + (at(i + 1, j) - at(i, j)) * fx;
    const bottom = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * fx;
    return top + (bottom - top) * fy;
  };
}

/**
 * Drifting cloud shadows: three octaves of wrapping value noise, thresholded so about half the sky is
 * clear and the rest shades the ground softly. Same seed, same clouds.
 */
export function cloudShadows(seed: number): Raster {
  const r = createRaster(CLOUD_SIZE, CLOUD_SIZE);
  const octaves = [valueNoise(seed, 3), valueNoise(seed + 1, 6), valueNoise(seed + 2, 12)];
  const weights = [0.6, 0.28, 0.12];
  for (let y = 0; y < CLOUD_SIZE; y++) {
    for (let x = 0; x < CLOUD_SIZE; x++) {
      const u = x / CLOUD_SIZE;
      const v = y / CLOUD_SIZE;
      let n = 0;
      octaves.forEach((f, k) => {
        n += f(u, v) * (weights[k] ?? 0);
      });
      const t = Math.min(1, Math.max(0, (n - COVER) / RAMP));
      const a = Math.round(t * t * (3 - 2 * t) * DEEPEST);
      if (a > 0) r.data.set([SHADE_RGB[0], SHADE_RGB[1], SHADE_RGB[2], a], (y * CLOUD_SIZE + x) * 4);
    }
  }
  return r;
}
