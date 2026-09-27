import * as Phaser from 'phaser';
import type { Light } from '@core/world/light';
import type { FrameIndex } from '@shell/gfx/frameIndex';
import { GAME_W } from '@shell/scale';

const PLAY_H = 352;
/** Above everything in the world (smoke is 100 000) and the rain, below the fade and the flash. */
export const DARK_DEPTH = 500_000;
/** Half the light frame's size: a light of radius r is the frame scaled by r / 64. */
const LIGHT_HALF = 64;

/** Fog hangs over the weather but under the dark. */
export const FOG_DEPTH = 450_000;

export interface VeilStyle {
  readonly colour: number;
  readonly depth: number;
}

const NIGHT: VeilStyle = { colour: 0x05040c, depth: DARK_DEPTH };
/** Pale fog. */
export const FOG: VeilStyle = { colour: 0xc9ced8, depth: FOG_DEPTH };

/**
 * A visibility layer: black at the sim's darkness (or pale fog at its thickness), with the lights (the
 * lantern, fires, the clear air around Ask in fog) erased out of it. Redrawn every frame it is visible,
 * which also survives a lost WebGL context.
 */
export class DarknessView {
  private readonly rt: Phaser.GameObjects.RenderTexture;
  private readonly light: { key: string; frame: string };
  /** What was drawn last (for the dev hook). */
  shown = { dark: 0, lights: 0 };

  constructor(
    scene: Phaser.Scene,
    frames: FrameIndex,
    private readonly style: VeilStyle = NIGHT,
  ) {
    this.rt = scene.add
      .renderTexture(0, 0, GAME_W, PLAY_H)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(style.depth)
      .setVisible(false);
    const ref = frames.get('fx_light_idle_s_0');
    this.light = { key: ref.key, frame: ref.frame };
  }

  /** `lights` are in camera pixels (the playfield's top-left is 0,0). */
  draw(darkness: number, lights: readonly Light[]): void {
    this.shown = { dark: darkness, lights: darkness > 0 ? lights.length : 0 };
    if (darkness <= 0) {
      this.rt.setVisible(false);
      return;
    }
    this.rt.setVisible(true);
    this.rt.clear();
    this.rt.fill(this.style.colour, darkness);
    for (const l of lights)
      this.rt.stamp(this.light.key, this.light.frame, Math.round(l.x), Math.round(l.y), {
        scale: l.r / LIGHT_HALF,
        blendMode: Phaser.BlendModes.ERASE,
      });
    this.rt.render();
  }

  destroy(): void {
    this.rt.destroy();
  }
}
