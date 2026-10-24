import { describe, expect, it } from 'vitest';
import { getPixel } from '@art/raster';
import { buildSprites } from '@art/sprites';
import { buildTileset } from '@art/tiles/tileset';
import { buildPortArt, PORT_TILE_CELL, PORT_TILE_COLS, type PortFrame } from '@port/art';

describe('port art (textures for native shells)', () => {
  const art = buildPortArt();
  const sprites = buildSprites();
  const frames = JSON.parse(art.frames) as PortFrame[];

  it('places every sprite frame once, by name, inside a page', () => {
    expect(frames.map((f) => f[0]).sort()).toEqual(sprites.map((s) => s.name).sort());
    for (const [, page, x, y, w, h] of frames) {
      expect(art.pages[page]).toBeDefined();
      expect(x + w).toBeLessThanOrEqual(art.pageW);
      expect(y + h).toBeLessThanOrEqual(art.pageHeights[page] ?? 0);
    }
  });

  it('copies each frame’s pixels and keeps its origin', () => {
    const sprite = sprites[sprites.length >> 1];
    if (sprite === undefined) throw new Error('no sprites');
    const f = frames.find((e) => e[0] === sprite.name);
    if (f === undefined) throw new Error('frame missing');
    const [, page, x, y, w, h, ox, oy] = f;
    expect([w, h, ox, oy]).toEqual([sprite.raster.w, sprite.raster.h, sprite.ox, sprite.oy]);
    const data = art.pages[page];
    if (data === undefined) throw new Error('page missing');
    const pageRaster = { w: art.pageW, h: art.pageHeights[page] ?? 0, data };
    for (let py = 0; py < h; py++)
      for (let px = 0; px < w; px++)
        expect(getPixel(pageRaster, x + px, y + py)).toEqual(getPixel(sprite.raster, px, py));
  });

  it('lays the tiles out on a grid with a one-pixel extruded border', () => {
    const tiles = buildTileset().tiles;
    expect(art.tileCount).toBe(tiles.length);
    expect(art.tiles.w).toBe(PORT_TILE_COLS * PORT_TILE_CELL);
    const i = Math.min(tiles.length - 1, 70);
    const tile = tiles[i];
    if (tile === undefined) throw new Error('no tile');
    const ox = (i % PORT_TILE_COLS) * PORT_TILE_CELL + 1;
    const oy = Math.floor(i / PORT_TILE_COLS) * PORT_TILE_CELL + 1;
    expect(getPixel(art.tiles, ox + 3, oy + 5)).toEqual(getPixel(tile, 3, 5));
    expect(getPixel(art.tiles, ox - 1, oy)).toEqual(getPixel(tile, 0, 0));
  });
});
