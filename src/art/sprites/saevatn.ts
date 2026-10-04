import type { AnimDef } from '../anims';
import { C } from '../palette';
import { createRaster, hex, setPixel, type Raster } from '../raster';
import type { SpriteFrame } from './types';

/**
 * A ripple ring on open water: what marks a dive spot (a sunk chest or piece of heart). It swells over two
 * frames; once the spot is emptied only a faint ring is left.
 */
function ripple(r: number, faint: boolean): Raster {
  const out = createRaster(16, 16);
  const ring = hex(faint ? C.waterShade : C.waterLight);
  const shade = hex(C.waterShade);
  for (const [rad, c] of [
    [r, ring],
    [r - 2, faint ? ring : shade],
  ] as const) {
    for (let a = 0; a < 48; a++) {
      const t = (a / 48) * 2 * Math.PI;
      setPixel(out, Math.round(8 + rad * Math.cos(t)), Math.round(9 + rad * 0.6 * Math.sin(t)), c);
    }
  }
  if (!faint) setPixel(out, 8, 9, ring);
  return out;
}

export function saevatnFrames(): SpriteFrame[] {
  const at = (name: string, raster: Raster): SpriteFrame => ({ name, raster, ox: 8, oy: 14 });
  return [
    at('fix_ripple_closed_s_0', ripple(4, false)),
    at('fix_ripple_closed_s_1', ripple(6, false)),
    at('fix_ripple_idle_s_0', ripple(4, false)),
    at('fix_ripple_idle_s_1', ripple(6, false)),
    at('fix_ripple_open_s_0', ripple(5, true)),
  ];
}

const one = (frames: number, fps: number): AnimDef => ({ frames, fps, loop: true, dirs: ['s'] });

export const SAEVATN_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  fix_ripple: { closed: one(2, 2), idle: one(2, 2), open: one(1, 1) },
};
