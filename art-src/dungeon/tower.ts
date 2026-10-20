import type { Raster } from '@art/raster';
import { grid, mirror, type DrawnFrame } from '../lib/sprite';
import { fade, inked, shadowed } from './fx';
import { HRIMGERDR, ICICLE, SVELLR } from './grids3';
import { HRIMGERDR_PAL, ICICLE_PAL, SVELLR_PAL } from './palette';

/**
 * Hrímturn's foes: Svellr the glacier construct, Hrímgerðr the Glass in her gown of ice, and the icicles
 * she brings down (south only: a shadow, the fall, the shatter).
 */
export function towerFrames(): DrawnFrame[] {
  const out: DrawnFrame[] = [];
  const add = (name: string, raster: Raster, ox: number, oy: number, mirrored: boolean): void => {
    const pivot = { x: ox / raster.w, y: oy / raster.h };
    out.push({ name, raster, pivot });
    if (mirrored) out.push({ name: name.replace(/_w_(\d+)$/, '_e_$1'), raster: mirror(raster), pivot });
  };
  const key = (table: Record<string, string>, k: string): string => {
    const text = table[k];
    if (text === undefined) throw new Error(`no grid ${k}`);
    return text;
  };
  for (const side of ['s', 'n', 'w'] as const) {
    const m = side === 'w';
    // Svellr: 44×40, feet at (22, 38).
    const svellr = (k: string): Raster => inked(grid(SVELLR_PAL, key(SVELLR, `${side}_${k}`)));
    const s = (anim: string, i: number, k: string): void => {
      add(`enemy_svellr_${anim}_${side}_${i}`, svellr(k), 22, 38, m);
    };
    s('idle', 0, 'idle');
    s('scrape', 0, 'scrape0');
    s('scrape', 1, 'scrape1');
    s('charge', 0, 'charge');
    s('stunned', 0, 'stunned');
    // Hrímgerðr: 40×62, feet at (20, 60); the glow about her casting hand is translucent.
    const giantess = (k: string): Raster =>
      fade(inked(grid(HRIMGERDR_PAL, key(HRIMGERDR, `${side}_${k}`))), '#b4ecff', 200);
    const h = (anim: string, i: number, k: string): void => {
      add(`enemy_hrimgerdr_${anim}_${side}_${i}`, giantess(k), 20, 60, m);
    };
    h('idle', 0, 'idle');
    h('roar', 0, 'roar');
    h('cast', 0, 'cast0');
    h('cast', 1, 'cast1');
    h('loose', 0, 'loose');
    h('kneel', 0, 'kneel');
  }
  // An icicle: 24×44, its ground point at (12, 41).
  const pivot = { x: 0.5, y: 41 / 44 };
  for (const pose of ['shadow', 'fall', 'shatter'] as const)
    for (let i = 0; i < 2; i++) {
      const text = key(ICICLE, `${pose}${i}`);
      const raster = pose === 'shadow' ? shadowed(grid(ICICLE_PAL, text)) : inked(grid(ICICLE_PAL, text));
      out.push({ name: `enemy_icicle_${pose}_s_${i}`, raster, pivot });
    }
  return out;
}
