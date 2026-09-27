import { describe, expect, it } from 'vitest';
import { insideBlob, onBlobEdge } from '@art/tiles/blob';
import { tileIndices } from '@art/tiles/indices';
import { buildTileset, tileAnimations } from '@art/tiles/tileset';
import { TERRAIN_IDS, type TerrainId } from '@content/terrain';
import { getPixel, rastersEqual, type Raster } from '@art/raster';

function differingPixels(a: Raster, b: Raster): number {
  let n = 0;
  for (let y = 0; y < a.h; y++)
    for (let x = 0; x < a.w; x++) {
      const pa = getPixel(a, x, y);
      const pb = getPixel(b, x, y);
      if (pa.some((v, i) => v !== pb[i])) n++;
    }
  return n;
}

function tile(ts: ReturnType<typeof buildTileset>, index: number): Raster {
  const t = ts.tiles[index];
  if (t === undefined) throw new Error(`no tile ${String(index)}`);
  return t;
}

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
    const total = TERRAIN_IDS.reduce((n, id) => n + ts.entries[id].count * ts.entries[id].frames, 0);
    expect(ts.tiles).toHaveLength(total + 2 * Object.keys(ts.cover).length);
    expect(ts.tiles.every((t) => t.w === 16 && t.h === 16)).toBe(true);
  });

  it('animates water and the ford in four frames, everything else in one', () => {
    for (const id of TERRAIN_IDS) {
      const e = ts.entries[id];
      if (id === 'water' || id === 'ford') expect(e, id).toMatchObject({ frames: 4, frameMs: 150 });
      else expect(e.frames, id).toBe(1);
    }
  });

  it('lists one tile animation per water and ford variant, frame-major', () => {
    const anims = tileAnimations(ts);
    expect(anims).toHaveLength(94);
    const s = ts.entries.water.start;
    expect(anims.find((a) => a.tile === s + 46)).toEqual({
      tile: s + 46,
      frames: [s + 46, s + 93, s + 140, s + 187],
      frameMs: 150,
    });
  });

  it('moves the water highlights between frames and leaves the rest alone', () => {
    const s = ts.entries.water.start + 46;
    const moved = differingPixels(tile(ts, s), tile(ts, s + 47));
    expect(moved).toBeGreaterThan(0);
    expect(moved).toBeLessThan(64);
  });

  it('lets water run into the ford with no bank between them', () => {
    const cells: TerrainId[] = Array.from({ length: 9 }, () => 'water');
    cells[4] = 'ford';
    const idx = tileIndices({ cols: 3, rows: 3, cells }, ts, 1);
    expect(idx[4]).toBe(ts.entries.ford.start + 46);
    expect(idx[1]).toBe(ts.entries.water.start + 46);
  });

  it('lets water run up to a jetty and keeps a roof whole around a chimney', () => {
    const pier: TerrainId[] = Array.from({ length: 9 }, () => 'water');
    pier[4] = 'jetty';
    const byPier = tileIndices({ cols: 3, rows: 3, cells: pier }, ts, 1);
    expect(byPier[1]).toBe(ts.entries.water.start + 46);
    const house: TerrainId[] = Array.from({ length: 9 }, () => 'roof');
    house[4] = 'chimney';
    const byStack = tileIndices({ cols: 3, rows: 3, cells: house }, ts, 1);
    expect(byStack[1]).toBe(ts.entries.roof.start + 46);
    expect(byStack[4]).toBe(ts.entries.chimney.start);
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

describe('cover tiles', () => {
  it('has a standing and a cut tile for every cover, drawn as overlays', async () => {
    const { COVERS } = await import('@content/ids');
    const { countOpaque } = await import('@art/raster');
    const ts = buildTileset();
    for (const id of COVERS) {
      const standing = ts.tiles[ts.cover[id].standing];
      const cut = ts.tiles[ts.cover[id].cut];
      if (standing === undefined || cut === undefined) throw new Error(`no tiles for ${id}`);
      expect(countOpaque(standing)).toBeGreaterThan(30);
      expect(countOpaque(standing)).toBeLessThan(256);
      expect(countOpaque(cut)).toBeLessThan(countOpaque(standing));
    }
  });
});
