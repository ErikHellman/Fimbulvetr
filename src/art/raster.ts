/** RGBA pixels, row-major. The art layer's only output format; the shell turns these into textures. */
export interface Raster {
  readonly w: number;
  readonly h: number;
  readonly data: Uint8ClampedArray;
}

export type Rgba = readonly [number, number, number, number];

export const TRANSPARENT: Rgba = [0, 0, 0, 0];

export function createRaster(w: number, h: number): Raster {
  return { w, h, data: new Uint8ClampedArray(w * h * 4) };
}

export function hex(color: string): Rgba {
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (m === null) throw new Error(`bad colour '${color}'`);
  const n = Number.parseInt(m[1] ?? '', 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff, 255];
}

const inside = (r: Raster, x: number, y: number): boolean => x >= 0 && y >= 0 && x < r.w && y < r.h;

export function setPixel(r: Raster, x: number, y: number, c: Rgba): void {
  if (!inside(r, x, y)) return;
  const i = (y * r.w + x) * 4;
  r.data[i] = c[0];
  r.data[i + 1] = c[1];
  r.data[i + 2] = c[2];
  r.data[i + 3] = c[3];
}

export function getPixel(r: Raster, x: number, y: number): Rgba {
  if (!inside(r, x, y)) return TRANSPARENT;
  const i = (y * r.w + x) * 4;
  return [r.data[i] ?? 0, r.data[i + 1] ?? 0, r.data[i + 2] ?? 0, r.data[i + 3] ?? 0];
}

export const alphaAt = (r: Raster, x: number, y: number): number =>
  inside(r, x, y) ? (r.data[(y * r.w + x) * 4 + 3] ?? 0) : 0;

export function copyRaster(src: Raster): Raster {
  return { w: src.w, h: src.h, data: new Uint8ClampedArray(src.data) };
}

/** Draws `src` onto `dst` at (dx, dy), skipping transparent pixels. */
export function blit(dst: Raster, src: Raster, dx: number, dy: number): void {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const c = getPixel(src, x, y);
      if (c[3] > 0) setPixel(dst, dx + x, dy + y, c);
    }
  }
}

export function flipX(src: Raster): Raster {
  const out = createRaster(src.w, src.h);
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) setPixel(out, src.w - 1 - x, y, getPixel(src, x, y));
  }
  return out;
}

/** Copies `src` into a raster `n` px larger on every side, repeating edge pixels (stops tile seams). */
export function extrude(src: Raster, n = 1): Raster {
  const out = createRaster(src.w + 2 * n, src.h + 2 * n);
  for (let y = -n; y < src.h + n; y++) {
    for (let x = -n; x < src.w + n; x++) {
      const sx = Math.min(src.w - 1, Math.max(0, x));
      const sy = Math.min(src.h - 1, Math.max(0, y));
      setPixel(out, x + n, y + n, getPixel(src, sx, sy));
    }
  }
  return out;
}

export function countOpaque(r: Raster): number {
  let n = 0;
  for (let i = 3; i < r.data.length; i += 4) if ((r.data[i] ?? 0) > 0) n += 1;
  return n;
}

export function rastersEqual(a: Raster, b: Raster): boolean {
  if (a.w !== b.w || a.h !== b.h) return false;
  return a.data.every((v, i) => v === b.data[i]);
}
