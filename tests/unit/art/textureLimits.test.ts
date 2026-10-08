import { describe, expect, it } from 'vitest';
import { FONT_SIZES, glyphsAt } from '@art/font';
import { packShelves } from '@art/pack';
import { buildSprites } from '@art/sprites';
import { buildTileset } from '@art/tiles/tileset';

/**
 * Every texture the shell builds stays within 4096 px a side, the WebGL texture limit of older iPhones and
 * iPads (Safari pass, M11b). The shell's own layouts are mirrored here: the tileset at 32 extruded 18 px
 * cells a row, sprite pages from the shelf packer, and the font at each size 16 cells a row.
 */
const LIMIT = 4096;

describe('texture sizes', () => {
  it('keeps the tileset within the limit', () => {
    const rows = Math.ceil(buildTileset().tiles.length / 32);
    expect(32 * 18).toBeLessThanOrEqual(LIMIT);
    expect(rows * 18).toBeLessThanOrEqual(LIMIT);
  });

  it('keeps every sprite page within the limit', () => {
    const pack = packShelves(buildSprites().map((f) => ({ name: f.name, w: f.raster.w, h: f.raster.h })));
    expect(pack.pageW).toBeLessThanOrEqual(LIMIT);
    for (const h of pack.heights) expect(h).toBeLessThanOrEqual(LIMIT);
  });

  it('keeps the font page within the limit at every size', () => {
    for (const size of FONT_SIZES) {
      const all = glyphsAt(size);
      const cellW = Math.max(...all.map((g) => g.raster.w)) + 1;
      const cellH = (all[0]?.raster.h ?? 0) + 1;
      expect(16 * cellW).toBeLessThanOrEqual(LIMIT);
      expect(Math.ceil(all.length / 16) * cellH).toBeLessThanOrEqual(LIMIT);
    }
  });
});
