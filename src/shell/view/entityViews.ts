import * as Phaser from 'phaser';
import { frameFor, type AnimTable } from '@art/anims';
import type { Entity } from '@core/actors/entity';
import type { Vec } from '@core/math/vec';
import type { FrameIndex } from '@shell/gfx/frameIndex';
import { bodyBounds, type Bounds } from './bounds';

/** Mirrors sim entities as sprites. Safe to call every frame: views are derived from state only. */
export class EntityViews {
  private readonly sprites = new Map<number, Phaser.GameObjects.Sprite>();
  private readonly shadows = new Map<number, Phaser.GameObjects.Sprite>();

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
      sprite.setPosition(Math.round(p.x), Math.round(p.y - (e.mem['z'] ?? 0)));
      sprite.setDepth(p.y);
      if (e.flash > 0 && Math.floor(e.flash / 2) % 2 === 0)
        sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else sprite.clearTint();
      const blink =
        e.kind === 'hero' && e.iframes > 0 && e.anim !== 'roll' && Math.floor(e.iframes / 4) % 2 === 0;
      sprite.setAlpha(blink ? 0.35 : 1);
      sprite.setVisible(e.mem['hidden'] !== 1);
      this.shadow(e, p);
    }
    for (const [id, sprite] of this.sprites) {
      if (!seen.has(id)) {
        sprite.destroy();
        this.sprites.delete(id);
      }
    }
    for (const [id, shadow] of this.shadows) {
      if (!seen.has(id)) {
        shadow.destroy();
        this.shadows.delete(id);
      }
    }
  }

  /** Where an entity's body is drawn (its hurt box at the sprite's feet), or null if it has no sprite yet. */
  bounds(e: Entity): Bounds | null {
    const s = this.sprites.get(e.id);
    if (s === undefined) return null;
    return bodyBounds(s.x, s.y, s.depth, e.hurt);
  }

  /** A soft shadow on the ground under anything lifted off it (hops, carried and thrown things). */
  private shadow(e: Entity, p: Vec): void {
    const z = e.mem['z'] ?? 0;
    let shadow = this.shadows.get(e.id);
    if (z <= 0.5) {
      shadow?.setVisible(false);
      return;
    }
    const ref = this.frames.get('fx_shadow_idle_s_0');
    if (shadow === undefined) {
      shadow = this.scene.add.sprite(0, 0, ref.key, ref.frame).setOrigin(ref.ox, ref.oy);
      this.shadows.set(e.id, shadow);
    }
    shadow
      .setVisible(true)
      .setPosition(Math.round(p.x), Math.round(p.y))
      .setDepth(p.y - 0.5);
  }
}
