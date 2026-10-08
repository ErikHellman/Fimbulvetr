import type * as Phaser from 'phaser';
import type { Vec } from '@core/math/vec';
import type { FrameIndex } from '@shell/gfx/frameIndex';

/** px between links. */
const GAP = 5;
/** The head is drawn this far above its ground point (as the sim's `z`). */
const HEAD_Z = 8;

/**
 * The grapple chain while it is out (`Sim.grapple()`): pooled links from Ask's hand to the hook's head,
 * drawn just in front of whichever end is nearer the bottom of the screen.
 */
export class ChainView {
  private readonly pool: Phaser.GameObjects.Image[] = [];
  /** Links drawn last frame (for the dev hook). */
  shown = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly frames: FrameIndex,
  ) {}

  draw(line: { readonly hand: Vec; readonly head: Vec } | null, origin: Vec): void {
    const ref = this.frames.get('fx_chain_idle_s_0');
    let n = 0;
    if (line !== null) {
      const x0 = origin.x + line.hand.x;
      const y0 = origin.y + line.hand.y;
      const x1 = origin.x + line.head.x;
      const y1 = origin.y + line.head.y - HEAD_Z;
      const count = Math.floor(Math.hypot(x1 - x0, y1 - y0) / GAP);
      const depth = Math.max(origin.y + line.hand.y + 6, origin.y + line.head.y) + 0.5;
      for (; n < count; n++) {
        const f = (n + 1) / (count + 1);
        let img = this.pool[n];
        if (img === undefined) {
          img = this.scene.add.image(0, 0, ref.key, ref.frame);
          this.pool.push(img);
        }
        img
          .setTexture(ref.key, ref.frame)
          .setPosition(Math.round(x0 + (x1 - x0) * f), Math.round(y0 + (y1 - y0) * f))
          .setDepth(depth)
          .setVisible(true);
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
