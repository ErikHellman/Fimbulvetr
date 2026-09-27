import type * as Phaser from 'phaser';
import { frameFor, type AnimTable } from '@art/anims';
import type { CoverGrid } from '@core/world/cover';
import type { Vec } from '@core/math/vec';
import type { FrameIndex } from '@shell/gfx/frameIndex';

const TILE = 16;

/**
 * Flames on the burning ground cover of the current screen: one pooled sprite per burning tile, y-sorted
 * with everything standing there, animated from the sim tick. Nothing is drawn while nothing burns.
 */
export class FireView {
  private readonly pool: Phaser.GameObjects.Sprite[] = [];
  /** Flames shown last frame (for the dev hook). */
  shown = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly frames: FrameIndex,
    private readonly anims: AnimTable,
  ) {}

  draw(cover: CoverGrid, origin: Vec, tick: number): void {
    let n = 0;
    if (cover.burning > 0) {
      for (let i = 0; i < cover.burn.length; i++) {
        if ((cover.burn[i] ?? 0) === 0) continue;
        const x = origin.x + (i % cover.cols) * TILE + TILE / 2;
        const y = origin.y + Math.floor(i / cover.cols) * TILE + TILE - 2;
        // Neighbouring flames flicker out of step.
        const ref = this.frames.get(frameFor(this.anims, 'fix_fire', 'burn', 's', tick + i * 7));
        let s = this.pool[n];
        if (s === undefined) {
          s = this.scene.add.sprite(0, 0, ref.key, ref.frame);
          this.pool.push(s);
        }
        s.setTexture(ref.key, ref.frame)
          .setOrigin(ref.ox, ref.oy)
          .setPosition(x, y)
          .setDepth(y)
          .setVisible(true);
        n += 1;
      }
    }
    for (let i = n; i < this.pool.length; i++) this.pool[i]?.setVisible(false);
    this.shown = n;
  }

  destroy(): void {
    for (const s of this.pool) s.destroy();
    this.pool.length = 0;
  }
}
