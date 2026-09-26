import { setPixel, type Raster, type Rgba } from './raster';

export type Fill = Rgba | ((x: number, y: number) => Rgba);

const colourAt = (fill: Fill, x: number, y: number): Rgba => (typeof fill === 'function' ? fill(x, y) : fill);

export function rect(r: Raster, x: number, y: number, w: number, h: number, c: Rgba): void {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) setPixel(r, xx, yy, c);
}

/** Fills pixels whose centres lie inside the ellipse. */
export function ellipse(r: Raster, cx: number, cy: number, rx: number, ry: number, fill: Fill): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) setPixel(r, x, y, colourAt(fill, x, y));
    }
  }
}

/** Bresenham line between integer points. */
export function line(r: Raster, x0: number, y0: number, x1: number, y1: number, c: Rgba): void {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const tx = Math.round(x1);
  const ty = Math.round(y1);
  const dx = Math.abs(tx - x);
  const dy = -Math.abs(ty - y);
  const sx = x < tx ? 1 : -1;
  const sy = y < ty ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    setPixel(r, x, y, c);
    if (x === tx && y === ty) return;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}
