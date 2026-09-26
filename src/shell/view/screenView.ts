import type * as Phaser from 'phaser';
import type { Vec } from '@core/math/vec';
import { SCREEN_COLS, SCREEN_ROWS, TILE } from '@core/world/dims';
import { TILESET_KEY } from '@shell/gfx/textures';

function rowsOf(indices: readonly number[]): number[][] {
  const rows: number[][] = [];
  for (let y = 0; y < SCREEN_ROWS; y++) rows.push(indices.slice(y * SCREEN_COLS, (y + 1) * SCREEN_COLS));
  return rows;
}

/** One screen as a Phaser tilemap: the ground layer plus a ground-cover layer above it. */
export class ScreenView {
  private readonly map: Phaser.Tilemaps.Tilemap;
  private readonly cover: Phaser.Tilemaps.TilemapLayer;

  constructor(scene: Phaser.Scene, origin: Vec, indices: readonly number[], cover: readonly number[]) {
    this.map = scene.make.tilemap({
      width: SCREEN_COLS,
      height: SCREEN_ROWS,
      tileWidth: TILE,
      tileHeight: TILE,
    });
    const tileset = this.map.addTilesetImage('tiles', TILESET_KEY, TILE, TILE, 1, 2);
    if (tileset === null) throw new Error('tileset texture missing');
    const ground = this.map.createBlankLayer('ground', tileset, origin.x, origin.y);
    const coverLayer = this.map.createBlankLayer('cover', tileset, origin.x, origin.y);
    if (ground === null || coverLayer === null) throw new Error('could not create the tile layers');
    ground.putTilesAt(rowsOf(indices), 0, 0);
    ground.setDepth(-2);
    coverLayer.setDepth(-1);
    this.cover = coverLayer;
    this.setCover(cover);
  }

  /** Redraws the cover layer; -1 leaves a cell empty. */
  setCover(indices: readonly number[]): void {
    this.cover.putTilesAt(rowsOf(indices), 0, 0);
  }

  destroy(): void {
    this.map.destroy();
  }
}
