import type * as Phaser from 'phaser';
import type { Vec } from '@core/math/vec';

const RUNE = 0x7fd8e8;
const RADIUS = 15;
/** How far above the feet the ring is centred (the middle of a 32 px figure). */
const LIFT = 13;

/**
 * Hlíf's ward (`Sim.ward()`): a faint ring round Ask with one bright rune-mark for each hit it still
 * holds, turning slowly. It flickers in its last two seconds.
 */
export class WardView {
  private readonly gfx: Phaser.GameObjects.Graphics;
  /** Runes drawn last frame (for the dev hook). */
  shown = 0;

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add.graphics();
  }

  draw(ward: { readonly hits: number; readonly ticks: number }, feet: Vec, tick: number): void {
    this.gfx.clear();
    this.shown = ward.hits;
    if (ward.hits <= 0 || (ward.ticks < 120 && Math.floor(tick / 6) % 2 === 1)) return;
    const cx = Math.round(feet.x);
    const cy = Math.round(feet.y - LIFT);
    this.gfx.setDepth(feet.y + 1);
    this.gfx.lineStyle(1, RUNE, 0.45).strokeCircle(cx, cy, RADIUS);
    for (let i = 0; i < ward.hits; i++) {
      const a = tick / 40 + (i * Math.PI * 2) / 3;
      const x = Math.round(cx + Math.cos(a) * RADIUS);
      const y = Math.round(cy + Math.sin(a) * RADIUS);
      this.gfx.fillStyle(RUNE, 1).fillRect(x - 1, y - 2, 3, 5);
    }
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
