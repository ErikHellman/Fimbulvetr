import { C } from './palette';
import { alphaAt, copyRaster, getPixel, hex, setPixel, type Raster, type Rgba } from './raster';
import { outline } from './outline';

const INK = hex(C.ink);
const isInk = (c: Rgba): boolean => c[0] === INK[0] && c[1] === INK[1] && c[2] === INK[2];

/**
 * The cel relight (docs/art-style-guide.md, rule 1): on a sprite drawn before its outline, every opaque
 * pixel on the figure's top or left silhouette edge takes a highlight, and every pixel on its bottom or
 * right edge a shade, so one light from the upper left falls on every creature and prop without each
 * painter drawing it. Ink pixels and interior pixels stay as they are.
 */
export function relight(src: Raster, light = 1.18, shade = 0.8): Raster {
  const out = copyRaster(src);
  const scale = (c: Rgba, f: number): Rgba => [
    Math.min(255, Math.round(c[0] * f)),
    Math.min(255, Math.round(c[1] * f)),
    Math.min(255, Math.round(c[2] * f)),
    c[3],
  ];
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      if (alphaAt(src, x, y) === 0) continue;
      const c = getPixel(src, x, y);
      if (isInk(c)) continue;
      const lit = alphaAt(src, x, y - 1) === 0 || alphaAt(src, x - 1, y) === 0;
      const dark = alphaAt(src, x, y + 1) === 0 || alphaAt(src, x + 1, y) === 0;
      if (lit) setPixel(out, x, y, scale(c, light));
      else if (dark) setPixel(out, x, y, scale(c, shade));
    }
  }
  return out;
}

/** Relight, then outline: the finish every creature, prop and pickup gets. */
export function cel(src: Raster, width: 1 | 2): Raster {
  return outline(relight(src), INK, width);
}
