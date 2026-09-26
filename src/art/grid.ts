import { createRaster, hex, setPixel, type Raster } from './raster';

/** Character → colour ('#rrggbb') or null for transparent. */
export type GridPalette = Readonly<Record<string, string | null>>;

export function decodeGrid(rows: readonly string[], pal: GridPalette): Raster {
  const w = rows[0]?.length ?? 0;
  const r = createRaster(w, rows.length);
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`grid row ${y}: expected width ${w}, got ${row.length}`);
    for (let x = 0; x < w; x++) {
      const ch = row.charAt(x);
      if (!(ch in pal)) throw new Error(`grid row ${y}, col ${x}: unknown colour '${ch}'`);
      const colour = pal[ch];
      if (colour !== null && colour !== undefined) setPixel(r, x, y, hex(colour));
    }
  });
  return r;
}
