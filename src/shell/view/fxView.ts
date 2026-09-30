import * as Phaser from 'phaser';
import { frameFor, type AnimTable } from '@art/anims';
import type { Vec } from '@core/math/vec';
import type { FrameIndex } from '@shell/gfx/frameIndex';

interface Burst {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly art: string;
  readonly born: number;
  readonly life: number;
}

/** One-shot effects that are not sim entities: the puff where an enemy dies, a blast. Timed by `sim.tick`. */
export class FxView {
  private readonly bursts: Burst[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly frames: FrameIndex,
    private readonly anims: AnimTable,
  ) {}

  /** A puff of smoke at a world point (an enemy's feet), drawn above it. */
  poof(at: Vec, tick: number): void {
    this.add('fx_poof', at, tick, 24);
  }

  /** A bomb going off at a world point (its feet). */
  blast(at: Vec, tick: number): void {
    this.add('fx_blast', at, tick, 24);
  }

  tick(t: number): void {
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      if (b === undefined) continue;
      const age = t - b.born;
      if (age >= b.life || age < 0) {
        b.sprite.destroy();
        this.bursts.splice(i, 1);
        continue;
      }
      const ref = this.frames.get(frameFor(this.anims, b.art, 'idle', 's', age));
      b.sprite.setTexture(ref.key, ref.frame).setOrigin(ref.ox, ref.oy);
    }
  }

  get alive(): number {
    return this.bursts.length;
  }

  destroy(): void {
    for (const b of this.bursts) b.sprite.destroy();
    this.bursts.length = 0;
  }

  private add(art: string, at: Vec, tick: number, life: number): void {
    const ref = this.frames.get(frameFor(this.anims, art, 'idle', 's', 0));
    const sprite = this.scene.add
      .sprite(Math.round(at.x), Math.round(at.y), ref.key, ref.frame)
      .setOrigin(ref.ox, ref.oy)
      .setDepth(at.y + 1);
    this.bursts.push({ sprite, art, born: tick, life });
  }
}
