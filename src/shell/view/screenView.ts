import type * as Phaser from 'phaser';
import type { Vec } from '@core/math/vec';
import { SCREEN_COLS, SCREEN_ROWS, TILE } from '@core/world/dims';
import { TILESET_KEY } from '@shell/gfx/textures';

/** One screen's ground as a Phaser tilemap layer, placed at the screen's world origin. */
export class ScreenView {
  private readonly map: Phaser.Tilemaps.Tilemap;

  constructor(scene: Phaser.Scene, origin: Vec, indices: readonly number[]) {
    this.map = scene.make.tilemap({
      width: SCREEN_COLS,
      height: SCREEN_ROWS,
      tileWidth: TILE,
      tileHeight: TILE,
    });
    const tileset = this.map.addTilesetImage('tiles', TILESET_KEY, TILE, TILE, 1, 2);
    if (tileset === null) throw new Error('tileset texture missing');
    const layer = this.map.createBlankLayer('ground', tileset, origin.x, origin.y);
    if (layer === null) throw new Error('could not create the ground layer');
    const rows: number[][] = [];
    for (let y = 0; y < SCREEN_ROWS; y++) rows.push(indices.slice(y * SCREEN_COLS, (y + 1) * SCREEN_COLS));
    layer.putTilesAt(rows, 0, 0);
    layer.setDepth(-1);
  }

  destroy(): void {
    this.map.destroy();
  }
}
