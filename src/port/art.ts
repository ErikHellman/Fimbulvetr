import { packShelves } from '@art/pack';
import { blit, createRaster, extrude, type Raster } from '@art/raster';
import { buildSprites } from '@art/sprites';
import { buildTileset } from '@art/tiles/tileset';
import { TILE } from '@core/world/dims';

/** Tiles per row of the tile page, and each tile's cell: 16 px plus a 1 px extruded border. */
export const PORT_TILE_COLS = 64;
export const PORT_TILE_CELL = TILE + 2;

/** One sprite frame on a page: name, page, x, y, w, h, and the origin (feet) inside the frame. */
export type PortFrame = [string, number, number, number, number, number, number, number];

/**
 * The generated art as plain RGBA pages a native renderer uploads once at boot: sprite pages with a
 * frame table (`frames`, JSON of `PortFrame`s), and the tile page laid out on a `PORT_TILE_COLS` grid.
 */
export interface PortArt {
  readonly pageW: number;
  readonly pageHeights: readonly number[];
  readonly pages: readonly Uint8ClampedArray[];
  readonly frames: string;
  readonly tiles: Raster;
  readonly tileCount: number;
}

export function buildPortArt(): PortArt {
  const sprites = buildSprites();
  const pack = packShelves(sprites.map((f) => ({ name: f.name, w: f.raster.w, h: f.raster.h })));
  const pages = pack.heights.map((h) => createRaster(pack.pageW, Math.max(1, h)));
  const frames: PortFrame[] = [];
  for (const f of sprites) {
    const at = pack.placements.get(f.name);
    const page = at === undefined ? undefined : pages[at.page];
    if (at === undefined || page === undefined) throw new Error(`port art: ${f.name} was not packed`);
    blit(page, f.raster, at.x, at.y);
    frames.push([f.name, at.page, at.x, at.y, f.raster.w, f.raster.h, f.ox, f.oy]);
  }
  const tileset = buildTileset();
  const rows = Math.ceil(tileset.tiles.length / PORT_TILE_COLS);
  const tiles = createRaster(PORT_TILE_COLS * PORT_TILE_CELL, rows * PORT_TILE_CELL);
  tileset.tiles.forEach((tile, i) => {
    blit(
      tiles,
      extrude(tile, 1),
      (i % PORT_TILE_COLS) * PORT_TILE_CELL,
      Math.floor(i / PORT_TILE_COLS) * PORT_TILE_CELL,
    );
  });
  return {
    pageW: pack.pageW,
    pageHeights: pages.map((p) => p.h),
    pages: pages.map((p) => p.data),
    frames: JSON.stringify(frames),
    tiles,
    tileCount: tileset.tiles.length,
  };
}
