import { createRng, nextFloat, type RngState } from '@core/math/rng';
import { createRaster, hex, setPixel, type Raster, type Rgba } from './raster';

/** A seeded drawing surface for procedural tiles. Same seed ⇒ same pixels. */
export interface Painter {
  readonly r: Raster;
  readonly rng: RngState;
  fill(color: string): void;
  px(x: number, y: number, color: string): void;
  rect(x: number, y: number, w: number, h: number, color: string): void;
  speckle(color: string, density: number): void;
}

export function createPainter(w: number, h: number, seed: number): Painter {
  const r = createRaster(w, h);
  const rng = createRng(seed);
  const cache = new Map<string, Rgba>();
  const rgba = (color: string): Rgba => {
    let c = cache.get(color);
    if (c === undefined) {
      c = hex(color);
      cache.set(color, c);
    }
    return c;
  };
  const px = (x: number, y: number, color: string): void => {
    setPixel(r, x, y, rgba(color));
  };
  const rect = (x: number, y: number, rw: number, rh: number, color: string): void => {
    for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) px(xx, yy, color);
  };
  return {
    r,
    rng,
    px,
    rect,
    fill: (color) => {
      rect(0, 0, w, h, color);
    },
    speckle: (color, density) => {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (nextFloat(rng) < density) px(x, y, color);
    },
  };
}
