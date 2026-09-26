import * as Phaser from 'phaser';
import { frameFor, type AnimTable } from '@art/anims';
import type { Entity } from '@core/actors/entity';
import type { Vec } from '@core/math/vec';
import type { FrameIndex } from '@shell/gfx/frameIndex';

/** Mirrors sim entities as sprites. Safe to call every frame: views are derived from state only. */
export class EntityViews {
  private readonly sprites = new Map<number, Phaser.GameObjects.Sprite>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly frames: FrameIndex,
    private readonly anims: AnimTable,
  ) {}

  sync(entities: readonly Entity[], place: (e: Entity) => Vec): void {
    const seen = new Set<number>();
    for (const e of entities) {
      seen.add(e.id);
      const ref = this.frames.get(frameFor(this.anims, e.art, e.anim, e.facing, e.animT));
      let sprite = this.sprites.get(e.id);
      if (sprite === undefined) {
        sprite = this.scene.add.sprite(0, 0, ref.key, ref.frame);
        this.sprites.set(e.id, sprite);
      } else if (sprite.texture.key !== ref.key || sprite.frame.name !== ref.frame) {
        sprite.setTexture(ref.key, ref.frame);
      }
      sprite.setOrigin(ref.ox, ref.oy);
      const p = place(e);
      sprite.setPosition(Math.round(p.x), Math.round(p.y));
      sprite.setDepth(p.y);
      if (e.flash > 0 && Math.floor(e.flash / 2) % 2 === 0)
        sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else sprite.clearTint();
      const blink =
        e.kind === 'hero' && e.iframes > 0 && e.anim !== 'roll' && Math.floor(e.iframes / 4) % 2 === 0;
      sprite.setAlpha(blink ? 0.35 : 1);
    }
    for (const [id, sprite] of this.sprites) {
      if (!seen.has(id)) {
        sprite.destroy();
        this.sprites.delete(id);
      }
    }
  }
}
