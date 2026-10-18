import { describe, expect, it } from 'vitest';
import { createPainter } from '@art/painter';
import { alphaAt } from '@art/raster';
import { FRINGE_ART, FRINGE_IDS, paintFringe } from '@art/tiles/fringe';
import { fringeIndices } from '@art/tiles/fringeIndices';
import { buildTileset } from '@art/tiles/tileset';
import { FRINGE_SPILL, type TerrainId } from '@content/terrain';
import { BLOB_MASKS, N } from '@core/world/autotile';
import type { TerrainGrid } from '@core/world/textmap';

const grassArt = FRINGE_ART.grass;
if (grassArt === undefined) throw new Error('grass fringe art missing');
const GRASS = grassArt;

function tile(own: number) {
  const p = createPainter(16, 16, 9);
  paintFringe(p, own, GRASS);
  return p.r;
}

describe('fringe tiles', () => {
  it('covers the edge nearest the spilling ground and leaves the rest clear', () => {
    // Grass to the north only: own ground is everything but N.
    const r = tile(~N & 0xff);
    expect(alphaAt(r, 8, 0)).toBe(255);
    expect(alphaAt(r, 8, 1)).toBe(255);
    expect(alphaAt(r, 8, 8)).toBe(0);
    expect(alphaAt(r, 8, 15)).toBe(0);
    expect(alphaAt(r, 0, 8)).toBe(0);
  });

  it('is transparent where nothing spills in', () => {
    const r = tile(0xff);
    for (let i = 3; i < r.data.length; i += 4) expect(r.data[i]).toBe(0);
  });

  it('rings a cell surrounded by the spilling ground', () => {
    const r = tile(0);
    expect(alphaAt(r, 0, 8)).toBe(255);
    expect(alphaAt(r, 15, 8)).toBe(255);
    expect(alphaAt(r, 8, 8)).toBe(0);
  });

  it('has every spilling ground in the spec, 47 tiles each, at the end of the tileset', () => {
    const ts = buildTileset();
    for (const id of Object.keys(FRINGE_SPILL.spill) as TerrainId[]) expect(ts.fringe[id], id).toBeDefined();
    expect(ts.tiles).toHaveLength(ts.shade.start + 8 + FRINGE_IDS.length * BLOB_MASKS.length);
  });

  it('indexes a sand cell beside grass to the grass fringe for that side', () => {
    const ts = buildTileset();
    const grid: TerrainGrid = { cols: 2, rows: 1, cells: ['grass', 'sand'] };
    const idx = fringeIndices(grid, ts, FRINGE_SPILL);
    expect(idx[0]).toBe(-1);
    const start = ts.fringe.grass?.start ?? -1;
    expect(idx[1]).toBeGreaterThanOrEqual(start);
    expect(idx[1]).toBeLessThan(start + 47);
    const r = ts.tiles[idx[1] ?? 0];
    expect(r && alphaAt(r, 0, 8)).toBe(255);
    expect(r && alphaAt(r, 15, 8)).toBe(0);
  });
});
