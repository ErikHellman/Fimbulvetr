import { line, rect } from '../draw';
import { C } from '../palette';
import { createRaster, hex } from '../raster';
import type { SpriteFrame } from './types';

/** Shown (and reported) whenever a frame name has no art yet. */
export function missingFrame(): SpriteFrame {
  const r = createRaster(16, 16);
  rect(r, 0, 0, 16, 16, hex(C.missing));
  line(r, 0, 0, 15, 15, hex(C.ink));
  line(r, 15, 0, 0, 15, hex(C.ink));
  return { name: 'missing', raster: r, ox: 8, oy: 16 };
}
