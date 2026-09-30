import { COVERS, type CoverId } from '@content/ids';
import { TERRAIN_IDS, type TerrainId } from '@content/terrain';
import { hashInts } from '@core/math/hash';
import { BLOB_MASKS } from '@core/world/autotile';
import { createPainter } from '../painter';
import type { Raster } from '../raster';
import { COVER_ART } from './cover';
import { WATER_ART } from './water';
import { TERRAIN_ART } from './terrain';

export interface TilesetEntry {
  /** First tile of frame 0. Frame `f` of variant `i` is at `start + f * count + i`. */
  readonly start: number;
  /** Variants per frame. */
  readonly count: number;
  readonly autotile: boolean;
  readonly frames: number;
  readonly frameMs: number;
  /** Auto-tile group: neighbours with the same group count as the same terrain. */
  readonly group: string;
}

/** A tile's animation: the frame-0 tile index and every frame's index in order. */
export interface TileAnim {
  readonly tile: number;
  readonly frames: readonly number[];
  readonly frameMs: number;
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
  /** The water level's overlay tiles (see waterIndices): a flooded sluice, and a race's floated planks. */
  readonly water: { readonly flooded: number; readonly afloat: number };
}

/**
 * Paints every tile variant once, in TERRAIN_IDS order. Auto-tiled terrain gets all 47 blob variants.
 * Animated terrain repeats its variants once per frame, frame-major, painted from the same seed so only what
 * the painter moves on purpose changes between frames.
 */
export function buildTileset(): Tileset {
  const tiles: Raster[] = [];
  const entries = {} as Record<TerrainId, TilesetEntry>;
  TERRAIN_IDS.forEach((id, terrainIndex) => {
    const art = TERRAIN_ART[id];
    const start = tiles.length;
    const count = art.autotile ? BLOB_MASKS.length : art.variants;
    const frames = art.frames ?? 1;
    for (let f = 0; f < frames; f++) {
      for (let i = 0; i < count; i++) {
        const p = createPainter(16, 16, hashInts(terrainIndex, i, 0x7e11));
        art.paint(p, { mask: art.autotile ? (BLOB_MASKS[i] ?? 0) : 0xff, variant: i, frame: f });
        tiles.push(p.r);
      }
    }
    entries[id] = {
      start,
      count,
      autotile: art.autotile,
      frames,
      frameMs: art.frameMs ?? 0,
      group: art.group ?? id,
    };
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
  const flooded = createPainter(16, 16, hashInts(0x3a7e, 1));
  WATER_ART.flooded(flooded);
  const afloat = createPainter(16, 16, hashInts(0x3a7e, 2));
  WATER_ART.afloat(afloat);
  const water = { flooded: tiles.length, afloat: tiles.length + 1 };
  tiles.push(flooded.r, afloat.r);
  return { tiles, entries, cover, water };
}

/** Every animated tile in the set: one entry per frame-0 tile of each multi-frame terrain. */
export function tileAnimations(tileset: Tileset): TileAnim[] {
  const out: TileAnim[] = [];
  for (const id of TERRAIN_IDS) {
    const e = tileset.entries[id];
    if (e.frames <= 1) continue;
    for (let i = 0; i < e.count; i++) {
      const tile = e.start + i;
      const frames = Array.from({ length: e.frames }, (_, f) => tile + f * e.count);
      out.push({ tile, frames, frameMs: e.frameMs });
    }
  }
  return out;
}
