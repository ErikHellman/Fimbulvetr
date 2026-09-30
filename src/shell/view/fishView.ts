import type * as Phaser from 'phaser';
import { frameFor, type AnimTable } from '@art/anims';
import type { Dir4 } from '@core/math/dir';
import type { Vec } from '@core/math/vec';
import { FISHING } from '@core/story/fishing';
import type { FrameIndex } from '@shell/gfx/frameIndex';
import type { FishUi } from '@shell/ui/fishText';

const TILE = 16;
/** The rod's tip from Ask's feet, by facing (matches the hero's `fish` pose). */
const TIP: Readonly<Record<Dir4, Vec>> = {
  s: { x: 13, y: -24 },
  n: { x: 9, y: -29 },
  w: { x: -13, y: -24 },
  e: { x: 13, y: -24 },
};
const LINE = 0xe8e4da;

/**
 * The fishing line and float while Ask fishes: the float flies out on the cast, bobs, twitches at a nibble
 * and goes under at the bite; while reeling it is drawn in toward the rod as the fish comes closer.
 */
export class FishView {
  private readonly float: Phaser.GameObjects.Sprite;
  private readonly line: Phaser.GameObjects.Graphics;
  /** Whether the float is out (for the dev hook). */
  shown = false;

  constructor(
    scene: Phaser.Scene,
    private readonly frames: FrameIndex,
    private readonly anims: AnimTable,
  ) {
    const ref = frames.get(frameFor(anims, 'fx_float', 'idle', 's', 0));
    this.float = scene.add.sprite(0, 0, ref.key, ref.frame).setVisible(false);
    this.line = scene.add.graphics();
  }

  draw(ui: FishUi | null, feet: Vec, facing: Dir4, origin: Vec, tick: number): void {
    this.line.clear();
    const out = ui !== null && ui.phase !== 'idle' && ui.phase !== 'result';
    this.float.setVisible(out);
    this.shown = out;
    if (!out) return;
    const tip = { x: feet.x + TIP[facing].x, y: feet.y + TIP[facing].y };
    const water = {
      x: origin.x + ui.float.x * TILE + TILE / 2,
      y: origin.y + ui.float.y * TILE + TILE / 2,
    };
    // Out along the line: flying on the cast, drawn in as the fish comes closer while reeling.
    const share =
      ui.phase === 'cast'
        ? Math.min(1, ui.t / FISHING.castTicks)
        : ui.phase === 'reel' && ui.maxDist > 0
          ? Math.min(1, ui.dist / ui.maxDist)
          : 1;
    const lift = ui.phase === 'cast' ? Math.round(Math.sin(share * Math.PI) * 24) : 0;
    const at = {
      x: Math.round(tip.x + (water.x - tip.x) * share),
      y: Math.round(tip.y + (water.y - tip.y) * share) - lift,
    };
    const anim = ui.bite || ui.phase === 'reel' ? 'bite' : ui.nibble ? 'nibble' : 'idle';
    const ref = this.frames.get(frameFor(this.anims, 'fx_float', anim, 's', tick));
    this.float
      .setTexture(ref.key, ref.frame)
      .setOrigin(ref.ox, ref.oy)
      .setPosition(at.x, at.y)
      .setDepth(water.y);
    this.line
      .lineStyle(1, LINE, 0.8)
      .lineBetween(tip.x, tip.y, at.x, at.y - 4)
      .setDepth(Math.max(water.y, feet.y) + 1);
  }

  destroy(): void {
    this.float.destroy();
    this.line.destroy();
  }
}
