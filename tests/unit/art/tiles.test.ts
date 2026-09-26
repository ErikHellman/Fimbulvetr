import { describe, expect, it } from 'vitest';
import { insideBlob, onBlobEdge } from '@art/tiles/blob';
import { tileIndices } from '@art/tiles/indices';
import { buildTileset } from '@art/tiles/tileset';
import { TERRAIN_IDS, type TerrainId } from '@content/terrain';
import { rastersEqual } from '@art/raster';

describe('blob shapes', () => {
  it('fills a fully surrounded tile completely', () => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) expect(insideBlob(0xff, x, y, 3)).toBe(true);
  });

  it('insets an isolated tile on every side and rounds its corners', () => {
    expect(insideBlob(0, 1, 8, 3)).toBe(false);
    expect(insideBlob(0, 8, 8, 3)).toBe(true);
    expect(insideBlob(0, 3, 3, 3)).toBe(false);
    expect(onBlobEdge(0, 3, 8, 3)).toBe(true);
    expect(onBlobEdge(0, 8, 8, 3)).toBe(false);
  });
});

describe('tileset', () => {
  const ts = buildTileset();

  it('has an entry for every terrain, with 47 variants for auto-tiled ones', () => {
    for (const id of TERRAIN_IDS) {
      const e = ts.entries[id];
      if (e.autotile) expect(e.count).toBe(47);
      else expect(e.count).toBeGreaterThan(0);
    }
    const total = TERRAIN_IDS.reduce((n, id) => n + ts.entries[id].count, 0);
    expect(ts.tiles).toHaveLength(total);
    expect(ts.tiles.every((t) => t.w === 16 && t.h === 16)).toBe(true);
  });

  it('is deterministic', () => {
    const again = buildTileset();
    expect(ts.tiles.every((t, i) => rastersEqual(t, again.tiles[i] ?? t))).toBe(true);
  });

  it('picks blob variants from neighbours', () => {
    const cells: TerrainId[] = Array.from({ length: 9 }, () => 'grass');
    cells[4] = 'water';
    const lone = tileIndices({ cols: 3, rows: 3, cells }, ts, 1);
    expect(lone[4]).toBe(ts.entries.water.start);
    const pond = tileIndices({ cols: 3, rows: 3, cells: Array.from({ length: 9 }, () => 'water') }, ts, 1);
    expect(pond[4]).toBe(ts.entries.water.start + 46);
  });

  it('keeps plain-terrain variants inside the terrain range', () => {
    const grass = tileIndices(
      { cols: 40, rows: 22, cells: Array.from({ length: 880 }, () => 'grass') },
      ts,
      7,
    );
    const { start, count } = ts.entries.grass;
    expect(grass.every((i) => i >= start && i < start + count)).toBe(true);
    expect(new Set(grass).size).toBeGreaterThan(1);
  });
});
