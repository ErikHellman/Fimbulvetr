import { describe, expect, it } from 'vitest';
import { alphaAt } from '@art/raster';
import { SHADE_TILES, paintShade } from '@art/tiles/shade';
import { buildTileset } from '@art/tiles/tileset';
import { SHADE_CORNER, SHADE_N, SHADE_W } from '@core/world/shade';
import { createPainter } from '@art/painter';

function tile(mask: number) {
  const p = createPainter(16, 16, 1);
  paintShade(p, mask);
  return p.r;
}

describe('shade tiles', () => {
  it('fades the north band downwards and the west band rightwards', () => {
    const n = tile(SHADE_N);
    expect(alphaAt(n, 8, 0)).toBeGreaterThan(alphaAt(n, 8, 2));
    expect(alphaAt(n, 8, 2)).toBeGreaterThan(alphaAt(n, 8, 5));
    expect(alphaAt(n, 8, 10)).toBe(0);
    const w = tile(SHADE_W);
    expect(alphaAt(w, 0, 8)).toBeGreaterThan(alphaAt(w, 2, 8));
    expect(alphaAt(w, 8, 8)).toBe(0);
  });

  it('keeps every pixel translucent so the ground still shows', () => {
    for (let mask = 1; mask < SHADE_TILES; mask++) {
      const r = tile(mask);
      for (let i = 3; i < r.data.length; i += 4) expect(r.data[i] ?? 0).toBeLessThan(140);
    }
  });

  it('shades only a small corner for the diagonal mask', () => {
    const c = tile(SHADE_CORNER);
    expect(alphaAt(c, 0, 0)).toBeGreaterThan(0);
    expect(alphaAt(c, 6, 6)).toBe(0);
    expect(alphaAt(c, 8, 0)).toBe(0);
  });

  it('leaves the empty mask fully transparent and sits after the water tiles', () => {
    const ts = buildTileset();
    expect(ts.shade.start).toBe(ts.water.afloat + 1);
    expect(ts.shade.start + SHADE_TILES).toBeLessThanOrEqual(ts.tiles.length);
    expect(ts.tiles[ts.shade.start]?.data.every((v, i) => i % 4 !== 3 || v === 0)).toBe(true);
  });
});
