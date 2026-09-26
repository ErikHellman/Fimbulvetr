import { alphaAt, copyRaster, setPixel, type Raster, type Rgba } from './raster';

/** Adds an outline around opaque pixels, one 4-neighbour ring per pass. The source needs `width` px of margin. */
export function outline(src: Raster, color: Rgba, width: 1 | 2): Raster {
  let current = src;
  for (let pass = 0; pass < width; pass++) {
    const out = copyRaster(current);
    for (let y = 0; y < current.h; y++) {
      for (let x = 0; x < current.w; x++) {
        if (alphaAt(current, x, y) > 0) continue;
        const touches =
          alphaAt(current, x - 1, y) > 0 ||
          alphaAt(current, x + 1, y) > 0 ||
          alphaAt(current, x, y - 1) > 0 ||
          alphaAt(current, x, y + 1) > 0;
        if (touches) setPixel(out, x, y, color);
      }
    }
    current = out;
  }
  return current;
}
