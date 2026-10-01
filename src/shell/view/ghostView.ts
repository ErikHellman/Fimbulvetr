import type * as Phaser from 'phaser';
import type { Vec } from '@core/math/vec';
import type { TilePos } from '@core/world/screen';
import type { FrameIndex } from '@shell/gfx/frameIndex';

const TILE = 16;

/**
 * Hidden floor over the pits, shown where light falls on it (`Sim.ghosts()`): one pooled flagstone per
 * lit tile, laid over the ground layer (the pit it spans) and under everything standing.
 */
export class GhostView {
  private readonly pool: Phaser.GameObjects.Image[] = [];
  /** Tiles shown last frame (for the dev hook). */
  shown = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly frames: FrameIndex,
  ) {}

  draw(tiles: readonly TilePos[], origin: Vec): void {
    const ref = this.frames.get('fx_ghost_idle_s_0');
    tiles.forEach((t, n) => {
      let img = this.pool[n];
      if (img === undefined) {
        img = this.scene.add.image(0, 0, ref.key, ref.frame).setOrigin(0, 0).setDepth(-0.5);
        this.pool.push(img);
      }
      img
        .setTexture(ref.key, ref.frame)
        .setPosition(origin.x + t.x * TILE, origin.y + t.y * TILE)
        .setVisible(true);
    });
    for (let i = tiles.length; i < this.pool.length; i++) this.pool[i]?.setVisible(false);
    this.shown = tiles.length;
  }

  destroy(): void {
    for (const s of this.pool) s.destroy();
    this.pool.length = 0;
  }
}
