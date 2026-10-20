import { outline } from '@art/outline';
import { C } from '@art/palette';
import { createRaster, getPixel, hex, setPixel, type Raster } from '@art/raster';
import { SHADOW_KEY } from './palette';

/** Every pixel of `colour` in `src` turned translucent at `alpha` (the halo of a wisp, a ground shadow). */
export function fade(src: Raster, colour: string, alpha: number | ((y: number) => number)): Raster {
  const c = hex(colour);
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const p = getPixel(src, x, y);
      if (p[3] > 0 && p[0] === c[0] && p[1] === c[1] && p[2] === c[2])
        setPixel(src, x, y, [p[0], p[1], p[2], typeof alpha === 'number' ? alpha : alpha(y)]);
    }
  return src;
}

/** The `S` shadow of a grid turned into translucent black. */
export const shadowed = (src: Raster): Raster => fade(src, SHADOW_KEY, 80);

const INK = hex(C.ink);
const SHADOW_RGB = hex(SHADOW_KEY);

/** Inks the figure of a grid but not its `S` shadow, which goes back under the figure, translucent. */
export function inked(src: Raster): Raster {
  const body = createRaster(src.w, src.h);
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const p = getPixel(src, x, y);
      const shadow = p[0] === SHADOW_RGB[0] && p[1] === SHADOW_RGB[1] && p[2] === SHADOW_RGB[2];
      if (p[3] > 0 && !shadow) setPixel(body, x, y, p);
    }
  const r = outline(body, INK, 1);
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const p = getPixel(src, x, y);
      if (
        p[3] > 0 &&
        getPixel(r, x, y)[3] === 0 &&
        p[0] === SHADOW_RGB[0] &&
        p[1] === SHADOW_RGB[1] &&
        p[2] === SHADOW_RGB[2]
      )
        setPixel(r, x, y, [0, 0, 0, 80]);
    }
  return r;
}

/** A wisp's halo and reflection softened: lighter below the reflection line. */
export const softened = (src: Raster, halo: string): Raster => fade(src, halo, (y) => (y > 26 ? 96 : 140));

/** Lowers a figure `sink` px into the ground: what goes below `floor` is gone. */
export function sunk(src: Raster, sink: number, floor: number): Raster {
  if (sink === 0) return src;
  const r = createRaster(src.w, src.h);
  for (let y = 0; y + sink <= floor; y++)
    for (let x = 0; x < src.w; x++) setPixel(r, x, y + sink, getPixel(src, x, y));
  return r;
}
