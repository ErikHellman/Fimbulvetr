import type * as Phaser from 'phaser';
import { cloudShadows } from '@art/clouds';
import { packShelves } from '@art/pack';
import { extrude, type Raster } from '@art/raster';
import type { SpriteFrame } from '@art/sprites';
import type { Tileset } from '@art/tiles/tileset';
import { TILE } from '@core/world/dims';
import { FrameIndex } from './frameIndex';
import { CLOUDS_KEY } from '@shell/view/cloudView';

export const TILESET_KEY = 'tiles';
/** Each 16 px tile is stored extruded to 18 px, so the tileset uses margin 1 and spacing 2. */
const TILE_CELL = TILE + 2;
const TILESET_COLS = 32;

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function context(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = c.getContext('2d');
  if (ctx === null) throw new Error('2D canvas unavailable');
  return ctx;
}

function put(ctx: CanvasRenderingContext2D, r: Raster, x: number, y: number): void {
  ctx.putImageData(new ImageData(new Uint8ClampedArray(r.data), r.w, r.h), x, y);
}

/** Packs code-drawn frames into canvas pages and registers every frame by name. */
export function registerSprites(
  textures: Phaser.Textures.TextureManager,
  frames: readonly SpriteFrame[],
): FrameIndex {
  const pack = packShelves(frames.map((f) => ({ name: f.name, w: f.raster.w, h: f.raster.h })));
  const pages = pack.heights.map((h) => canvas(pack.pageW, Math.max(1, h)));
  const index = new FrameIndex();
  pages.forEach((page, p) => {
    const ctx = context(page);
    const onPage = frames.filter((f) => pack.placements.get(f.name)?.page === p);
    for (const f of onPage) {
      const at = pack.placements.get(f.name);
      if (at !== undefined) put(ctx, f.raster, at.x, at.y);
    }
    const key = `sprites_${p}`;
    const texture = textures.addCanvas(key, page);
    if (texture === null) throw new Error(`could not add texture ${key}`);
    for (const f of onPage) {
      const at = pack.placements.get(f.name);
      if (at === undefined) continue;
      texture.add(f.name, 0, at.x, at.y, f.raster.w, f.raster.h);
      index.set(f.name, { key, frame: f.name, ox: f.ox / f.raster.w, oy: f.oy / f.raster.h });
    }
  });
  return index;
}

/** The top-left of tile `i`'s 16 px square on the tileset page (inside its 1 px extrusion). */
export function tileOrigin(i: number): { x: number; y: number } {
  return { x: (i % TILESET_COLS) * TILE_CELL + 1, y: Math.floor(i / TILESET_COLS) * TILE_CELL + 1 };
}

export function registerTileset(textures: Phaser.Textures.TextureManager, tileset: Tileset): void {
  const rows = Math.ceil(tileset.tiles.length / TILESET_COLS);
  const page = canvas(TILESET_COLS * TILE_CELL, rows * TILE_CELL);
  const ctx = context(page);
  tileset.tiles.forEach((tile, i) => {
    const at = tileOrigin(i);
    put(ctx, extrude(tile, 1), at.x - 1, at.y - 1);
  });
  if (textures.addCanvas(TILESET_KEY, page) === null) throw new Error('could not add the tileset texture');
}

/** The tiling cloud-shadow texture the CloudView scrolls over outdoor screens. */
export function registerClouds(textures: Phaser.Textures.TextureManager): void {
  const r = cloudShadows(0xc10d);
  const page = canvas(r.w, r.h);
  put(context(page), r, 0, 0);
  if (textures.addCanvas(CLOUDS_KEY, page) === null) throw new Error('could not add the cloud texture');
}
