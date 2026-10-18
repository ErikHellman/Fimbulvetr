import { TERRAIN_IDS, type TerrainId } from '@content/terrain';
import { TILE } from '@core/world/dims';

/**
 * Real art replaces code-drawn art by name, with no code changes, through `public/atlases/manifest.json`.
 * An atlas is a TexturePacker-style JSON atlas (hash or array): every frame whose name matches a
 * placeholder frame replaces it. A tile sheet is a PNG of 16 px cells in the tileset's order for one
 * terrain (frame-major: frame `f`, variant `i` at cell `f * count + i`; the 47 blob variants in
 * `BLOB_MASKS` order for auto-tiled terrain). Paths are relative to the `atlases/` folder.
 */
export interface AtlasRef {
  readonly key: string;
  readonly image: string;
  readonly data: string;
}

export interface TileSheetRef {
  readonly terrain: TerrainId;
  readonly image: string;
}

export interface ArtManifest {
  readonly atlases: readonly AtlasRef[];
  readonly tiles: readonly TileSheetRef[];
}

export const ART_MANIFEST_VERSION = 1;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function path(v: unknown, what: string): string {
  if (typeof v !== 'string' || v === '') throw new Error(`art manifest: ${what} must be a file name`);
  if (v.startsWith('/') || v.split('/').includes('..'))
    throw new Error(`art manifest: ${what} is not a relative path inside atlases/: '${v}'`);
  return v;
}

function list(v: unknown, what: string): readonly unknown[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) throw new Error(`art manifest: ${what} must be a list`);
  return v as readonly unknown[];
}

const isTerrain = (v: unknown): v is TerrainId =>
  typeof v === 'string' && (TERRAIN_IDS as readonly string[]).includes(v);

/** Validates a parsed manifest.json; throws a readable message on anything off. */
export function parseArtManifest(json: unknown): ArtManifest {
  if (!isRecord(json)) throw new Error('art manifest: expected a JSON object');
  if (json['version'] !== ART_MANIFEST_VERSION) {
    throw new Error(`art manifest: version must be ${String(ART_MANIFEST_VERSION)}`);
  }
  const atlases = list(json['atlases'], 'atlases').map((a, i): AtlasRef => {
    if (!isRecord(a)) throw new Error(`art manifest: atlases[${String(i)}] must be an object`);
    const key = a['key'];
    if (typeof key !== 'string' || key === '')
      throw new Error(`art manifest: atlases[${String(i)}].key must be a name`);
    return {
      key,
      image: path(a['image'], `atlases[${String(i)}].image`),
      data: path(a['data'], `atlases[${String(i)}].data`),
    };
  });
  const tiles = list(json['tiles'], 'tiles').map((t, i): TileSheetRef => {
    if (!isRecord(t)) throw new Error(`art manifest: tiles[${String(i)}] must be an object`);
    const terrain = t['terrain'];
    if (!isTerrain(terrain))
      throw new Error(`art manifest: tiles[${String(i)}].terrain '${String(terrain)}' is not a terrain id`);
    return { terrain, image: path(t['image'], `tiles[${String(i)}].image`) };
  });
  return { atlases, tiles };
}

export interface FrameSize {
  readonly w: number;
  readonly h: number;
}

/** A normalised origin: the frame's feet point as a fraction of its size. */
export interface Origin {
  readonly ox: number;
  readonly oy: number;
}

/**
 * The origin of a real frame that replaces a placeholder. An atlas pivot wins. Without one the placeholder's
 * feet point is kept, with the real frame centred on it horizontally and standing on the same ground line,
 * so a bigger real sprite grows outward and upward.
 */
export function overrideOrigin(placeholder: FrameSize & Origin, real: FrameSize, pivot?: Origin): Origin {
  if (pivot !== undefined) return { ox: pivot.ox, oy: pivot.oy };
  const feetX = placeholder.ox * placeholder.w + (real.w - placeholder.w) / 2;
  const feetY = placeholder.oy * placeholder.h + (real.h - placeholder.h);
  return { ox: feetX / real.w, oy: feetY / real.h };
}

/** Where cell `i` of a tile sheet sits: cells read left to right, then down, as many per row as fit. */
export function sheetCell(i: number, sheetW: number, cell = TILE): { x: number; y: number } {
  const perRow = Math.max(1, Math.floor(sheetW / cell));
  return { x: (i % perRow) * cell, y: Math.floor(i / perRow) * cell };
}

/** How many whole cells a sheet holds. */
export function sheetCells(sheetW: number, sheetH: number, cell = TILE): number {
  return Math.floor(sheetW / cell) * Math.floor(sheetH / cell);
}
