import { COVERS, type CoverId } from '@content/ids';
import { TERRAIN_IDS, type TerrainId } from '@content/terrain';
import { hashInts } from '@core/math/hash';
import { BLOB_MASKS } from '@core/world/autotile';
import { createPainter } from '../painter';
import type { Raster } from '../raster';
import { COVER_ART } from './cover';
import { TERRAIN_ART } from './terrain';

export interface TilesetEntry {
  readonly start: number;
  readonly count: number;
  readonly autotile: boolean;
}

export interface CoverEntry {
  /** Tile index of standing cover, and of what is left once cut. */
  readonly standing: number;
  readonly cut: number;
}

export interface Tileset {
  readonly tiles: readonly Raster[];
  readonly entries: Readonly<Record<TerrainId, TilesetEntry>>;
  /** Cover tiles are transparent overlays drawn on a layer above the ground. */
  readonly cover: Readonly<Record<CoverId, CoverEntry>>;
}

/** Paints every tile variant once, in TERRAIN_IDS order. Auto-tiled terrain gets all 47 blob variants. */
export function buildTileset(): Tileset {
  const tiles: Raster[] = [];
  const entries = {} as Record<TerrainId, TilesetEntry>;
  TERRAIN_IDS.forEach((id, terrainIndex) => {
    const art = TERRAIN_ART[id];
    const start = tiles.length;
    const count = art.autotile ? BLOB_MASKS.length : art.variants;
    for (let i = 0; i < count; i++) {
      const p = createPainter(16, 16, hashInts(terrainIndex, i, 0x7e11));
      art.paint(p, { mask: art.autotile ? (BLOB_MASKS[i] ?? 0) : 0xff, variant: i });
      tiles.push(p.r);
    }
    entries[id] = { start, count, autotile: art.autotile };
  });
  const cover = {} as Record<CoverId, CoverEntry>;
  COVERS.forEach((id, i) => {
    const art = COVER_ART[id];
    const standing = createPainter(16, 16, hashInts(0xc0, i, 1));
    art.standing(standing);
    const cut = createPainter(16, 16, hashInts(0xc0, i, 2));
    art.cut(cut);
    cover[id] = { standing: tiles.length, cut: tiles.length + 1 };
    tiles.push(standing.r, cut.r);
  });
  return { tiles, entries, cover };
}
