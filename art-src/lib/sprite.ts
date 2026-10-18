import { decodeGrid, type GridPalette } from '@art/grid';
import { blit, createRaster, flipX, getPixel, setPixel, type Raster } from '@art/raster';

export type { Raster };

/** A drawn frame: its raster and the feet point as a fraction of the frame. */
export interface DrawnFrame {
  readonly name: string;
  readonly raster: Raster;
  readonly pivot: { readonly x: number; readonly y: number };
}

/** Trims the margin lines of a template-string grid and decodes it. Rows may be separated by blank lines. */
export function grid(pal: GridPalette, text: string): Raster {
  const rows = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '');
  return decodeGrid(rows, pal);
}

/** A transparent frame of the given size. */
export const frame = (size: number): Raster => createRaster(size, size);

/** Pastes `src` onto `dst` with its top-left at (x, y); transparent source pixels leave `dst` alone. */
export function paste(dst: Raster, src: Raster, x: number, y: number): void {
  blit(dst, src, x, y);
}

export const mirror = (r: Raster): Raster => flipX(r);

/** Rotates a raster a quarter turn clockwise. */
export function rot90(src: Raster): Raster {
  const out = createRaster(src.h, src.w);
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) setPixel(out, src.h - 1 - y, x, getPixel(src, x, y));
  return out;
}

export function flipY(src: Raster): Raster {
  const out = createRaster(src.w, src.h);
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) setPixel(out, x, src.h - 1 - y, getPixel(src, x, y));
  return out;
}
