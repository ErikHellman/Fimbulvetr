import * as Phaser from 'phaser';
import type { Light } from '@core/world/light';
import type { FrameIndex } from '@shell/gfx/frameIndex';
import { DARK_DEPTH } from './darknessView';

/** Just under the dark, so the warmth sits on the world the light reveals. */
const GLOW_DEPTH = DARK_DEPTH - 1;
/** Lantern and fire light is amber; the glow frame is white and tinted. */
const WARM = 0xffb24a;
/** The glow at full darkness (it fades in with the dark, so dusk is only faintly warm). */
const GLOW_ALPHA = 0.3;
/** The glow reaches a little past the circle cut out of the dark. */
const SPREAD = 1.35;
const LIGHT_HALF = 64;

/**
 * Warm additive glows over every light the dark is cut out around, so lanterns and fires colour what they
 * reveal. Fires and stones flicker a little; the hero's own light stays steady.
 */
export class GlowView {
  private readonly pool: Phaser.GameObjects.Image[] = [];
  private readonly glow: { key: string; frame: string };
  shown = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    frames: FrameIndex,
  ) {
    const ref = frames.get('fx_light_idle_s_0');
    this.glow = { key: ref.key, frame: ref.frame };
  }

  /** `lights` are in camera pixels; `now` is wall-clock ms for the flicker. */
  draw(darkness: number, lights: readonly Light[], now: number): void {
    const alpha = Math.min(1, darkness * 2) * GLOW_ALPHA;
    const count = alpha > 0 ? lights.length : 0;
    this.shown = count;
    while (this.pool.length < count) {
      this.pool.push(
        this.scene.add
          .image(0, 0, this.glow.key, this.glow.frame)
          .setScrollFactor(0)
          .setDepth(GLOW_DEPTH)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setTint(WARM),
      );
    }
    this.pool.forEach((img, i) => {
      const l = lights[i];
      if (i >= count || l === undefined) {
        img.setVisible(false);
        return;
      }
      const flicker =
        l.hero === true ? 1 : 1 + 0.05 * Math.sin(now / 90 + i * 1.7) + 0.03 * Math.sin(now / 37 + i);
      img
        .setVisible(true)
        .setPosition(Math.round(l.x), Math.round(l.y))
        .setScale((l.r / LIGHT_HALF) * SPREAD * flicker)
        .setAlpha(alpha * (l.hero === true ? 1 : Math.min(1, 0.6 + 0.4 * flicker)));
    });
  }

  destroy(): void {
    for (const img of this.pool) img.destroy();
    this.pool.length = 0;
  }
}
