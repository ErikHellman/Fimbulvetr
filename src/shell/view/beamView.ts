import type * as Phaser from 'phaser';
import type { Vec } from '@core/math/vec';
import type { BeamSeg } from '@core/sim/systems/beams';
import { SCREEN_COLS, SCREEN_ROWS, TILE } from '@core/world/dims';

const GLOW = 0xa8d8f0;
/** Hrímgerðr's glazed floor: a pale sheen over the rows she has frozen. */
const RIME = 0xd8f0ff;
const CORE = 0xf4fcff;
/** Beams are drawn this far above the tile middles (a shaft of light at chest height). */
const LIFT = 6;

/**
 * Hrímturn's beams of rime-light (`Sim.beams()`, M9b): a pale glow three pixels wide with a bright core,
 * flickering faintly, just above the floor and under everyone standing in it.
 */
export class BeamView {
  private readonly gfx: Phaser.GameObjects.Graphics;
  /** Stretches drawn last frame (for the dev hook). */
  shown = 0;

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add.graphics().setDepth(-0.5);
  }

  draw(segs: readonly BeamSeg[], origin: Vec, tick: number, rimeFloor: number | null = null): void {
    this.gfx.clear();
    this.shown = segs.length;
    if (rimeFloor !== null)
      this.gfx
        .fillStyle(RIME, 0.3)
        .fillRect(
          origin.x,
          origin.y + rimeFloor * TILE,
          SCREEN_COLS * TILE,
          (SCREEN_ROWS - rimeFloor) * TILE,
        );
    const glow = 0.35 + (Math.floor(tick / 5) % 3) * 0.05;
    for (const s of segs) {
      const x = Math.round(origin.x + Math.min(s.x0, s.x1));
      const y = Math.round(origin.y + Math.min(s.y0, s.y1) - LIFT);
      const w = Math.abs(s.x1 - s.x0);
      const h = Math.abs(s.y1 - s.y0);
      this.gfx.fillStyle(GLOW, glow).fillRect(x - 2, y - 2, w + 5, h + 5);
      this.gfx.fillStyle(CORE, 0.9).fillRect(x - 0.5, y - 0.5, w + 1, h + 1);
    }
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
