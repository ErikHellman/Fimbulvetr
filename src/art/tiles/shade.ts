import { SHADE_CORNER, SHADE_N, SHADE_W } from '@core/world/shade';
import type { Painter } from '../painter';
import { setPixel } from '../raster';

/** Shade tiles in the tileset: one per mask value 0–7 (bit combinations of SHADE_N, SHADE_W, SHADE_CORNER). */
export const SHADE_TILES = 8;

/** A cool, dark cast: ink with a little blue, so shade reads as shadow rather than dirt. */
const SHADE_RGB: readonly [number, number, number] = [16, 12, 30];
/** Alpha by distance from a raised edge to the north (rows) and to the west (columns). */
const NORTH: readonly number[] = [104, 84, 62, 42, 26, 12];
const WEST: readonly number[] = [72, 46, 24, 10];
const CORNER: readonly number[] = [60, 34, 14];

/** Paints the translucent shade overlay for one mask: bands that fade away from the raised edge. */
export function paintShade(p: Painter, mask: number): void {
  const alpha = new Uint8Array(16 * 16);
  const put = (x: number, y: number, a: number): void => {
    const i = y * 16 + x;
    alpha[i] = Math.max(alpha[i] ?? 0, a);
  };
  if ((mask & SHADE_N) !== 0)
    NORTH.forEach((a, y) => {
      for (let x = 0; x < 16; x++) put(x, y, a);
    });
  if ((mask & SHADE_W) !== 0)
    WEST.forEach((a, x) => {
      for (let y = 0; y < 16; y++) put(x, y, a);
    });
  if ((mask & SHADE_CORNER) !== 0)
    CORNER.forEach((a, d) => {
      for (let i = 0; i <= d; i++) {
        put(i, d - i, a);
      }
    });
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const a = alpha[y * 16 + x] ?? 0;
      if (a > 0) setPixel(p.r, x, y, [SHADE_RGB[0], SHADE_RGB[1], SHADE_RGB[2], a]);
    }
}
