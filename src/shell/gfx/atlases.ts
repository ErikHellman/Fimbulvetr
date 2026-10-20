import type * as Phaser from 'phaser';
import { type ArtManifest, overrideOrigin, parseArtManifest, sheetCell, sheetCells } from '@art/atlas';
import type { Tileset } from '@art/tiles/tileset';
import { TILE } from '@core/world/dims';
import type { FrameIndex } from './frameIndex';
import { TILESET_KEY, tileOrigin } from './textures';

/**
 * Real art over the code-drawn placeholders (see `docs/real-art.md`). `queueArtOverrides` runs in the
 * boot scene's preload: it loads `atlases/manifest.json` and queues every atlas and tile sheet it names;
 * `applyArtOverrides` runs in create, after the placeholders exist, and points matching frame names at
 * the loaded atlases and paints the tile sheets over the generated tileset. A missing or broken manifest
 * leaves the placeholders in place.
 */
export const MANIFEST_KEY = 'art_manifest';
const DIR = 'atlases/';
const atlasKey = (key: string): string => `atlas_${key}`;
const sheetKey = (terrain: string): string => `sheet_${terrain}`;

/** What real art replaced: frame names, and terrain ids whose tiles were repainted. */
export interface ArtOverrides {
  readonly frames: readonly string[];
  readonly tiles: readonly string[];
}

export const NO_OVERRIDES: ArtOverrides = { frames: [], tiles: [] };

function manifestOf(data: unknown): ArtManifest | null {
  if (data === undefined || data === null) return null;
  try {
    return parseArtManifest(data);
  } catch (e) {
    console.warn(`[art] ${e instanceof Error ? e.message : String(e)}; keeping the placeholder art`);
    return null;
  }
}

export function queueArtOverrides(load: Phaser.Loader.LoaderPlugin): void {
  load.json(MANIFEST_KEY, `${DIR}manifest.json`);
  load.once(`filecomplete-json-${MANIFEST_KEY}`, (_key: string, _type: string, data: unknown) => {
    const m = manifestOf(data);
    if (m === null) return;
    for (const a of m.atlases) load.atlas(atlasKey(a.key), DIR + a.image, DIR + a.data);
    for (const t of m.tiles) load.image(sheetKey(t.terrain), DIR + t.image);
  });
}

/** Copies one 16 px tile from a sheet onto the tileset page, with the 1 px extrusion around it. */
function blitExtruded(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  sx: number,
  sy: number,
  dx: number,
  dy: number,
): void {
  const n = TILE;
  const e = n - 1;
  ctx.clearRect(dx - 1, dy - 1, n + 2, n + 2);
  ctx.drawImage(img, sx, sy, n, n, dx, dy, n, n);
  ctx.drawImage(img, sx, sy, n, 1, dx, dy - 1, n, 1);
  ctx.drawImage(img, sx, sy + e, n, 1, dx, dy + n, n, 1);
  ctx.drawImage(img, sx, sy, 1, n, dx - 1, dy, 1, n);
  ctx.drawImage(img, sx + e, sy, 1, n, dx + n, dy, 1, n);
  ctx.drawImage(img, sx, sy, 1, 1, dx - 1, dy - 1, 1, 1);
  ctx.drawImage(img, sx + e, sy, 1, 1, dx + n, dy - 1, 1, 1);
  ctx.drawImage(img, sx, sy + e, 1, 1, dx - 1, dy + n, 1, 1);
  ctx.drawImage(img, sx + e, sy + e, 1, 1, dx + n, dy + n, 1, 1);
}

export function applyArtOverrides(scene: Phaser.Scene, frames: FrameIndex, tileset: Tileset): ArtOverrides {
  const m = manifestOf(scene.cache.json.get(MANIFEST_KEY) as unknown);
  if (m === null) return NO_OVERRIDES;
  const textures = scene.textures;
  const replacedFrames: string[] = [];
  const unknown: string[] = [];
  for (const a of m.atlases) {
    const key = atlasKey(a.key);
    if (!textures.exists(key)) continue;
    const texture = textures.get(key);
    for (const name of texture.getFrameNames()) {
      if (!frames.has(name)) {
        unknown.push(name);
        continue;
      }
      const old = frames.get(name);
      const placeholder = textures.getFrame(old.key, old.frame);
      const real = texture.get(name);
      const pivot = real.customPivot ? { ox: real.pivotX, oy: real.pivotY } : undefined;
      const origin = overrideOrigin(
        { w: placeholder.width, h: placeholder.height, ox: old.ox, oy: old.oy },
        { w: real.realWidth, h: real.realHeight },
        pivot,
      );
      frames.set(name, { key, frame: name, ox: origin.ox, oy: origin.oy });
      replacedFrames.push(name);
    }
  }
  if (unknown.length > 0)
    console.warn(`[art] atlas frames with no placeholder (ignored): ${unknown.join(', ')}`);
  const replacedTiles: string[] = [];
  const page = textures.get(TILESET_KEY) as Phaser.Textures.CanvasTexture;
  const ctx = page.getContext();
  for (const t of m.tiles) {
    const key = sheetKey(t.terrain);
    if (!textures.exists(key)) continue;
    const img = textures.get(key).getSourceImage();
    if (!(img instanceof HTMLImageElement) && !(img instanceof HTMLCanvasElement)) continue;
    const entry = tileset.entries[t.terrain];
    const n = Math.min(entry.count * entry.frames, sheetCells(img.width, img.height));
    for (let i = 0; i < n; i++) {
      const src = sheetCell(i, img.width);
      const dst = tileOrigin(entry.start + i);
      blitExtruded(ctx, img, src.x, src.y, dst.x, dst.y);
    }
    if (n > 0) replacedTiles.push(t.terrain);
    // Painted into the tileset: the sheet itself is never drawn again.
    textures.remove(key);
  }
  if (replacedTiles.length > 0) page.refresh();
  return { frames: replacedFrames, tiles: replacedTiles };
}
