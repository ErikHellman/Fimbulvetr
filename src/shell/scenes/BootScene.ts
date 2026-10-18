import * as Phaser from 'phaser';
import { buildSprites } from '@art/sprites';
import { buildTileset } from '@art/tiles/tileset';
import { registerSfx } from '@shell/audio/sfx';
import { applyArtOverrides, queueArtOverrides } from '@shell/gfx/atlases';
import { registerFont } from '@shell/gfx/font';
import { registerClouds, registerSprites, registerTileset } from '@shell/gfx/textures';
import type { PlayData, Services } from '@shell/services';

/** Generates all placeholder art into textures, lays any real art over it, then starts play. */
export class BootScene extends Phaser.Scene {
  constructor(private readonly services: Services) {
    super('boot');
  }

  preload(): void {
    queueArtOverrides(this.load);
  }

  create(): void {
    registerSfx(this);
    registerFont(this);
    const frames = registerSprites(this.textures, buildSprites());
    const tileset = buildTileset();
    registerTileset(this.textures, tileset);
    registerClouds(this.textures);
    const overrides = applyArtOverrides(this, frames, tileset);
    const data: PlayData = { ...this.services, assets: { frames, tileset, overrides } };
    this.scene.start(this.services.start, data);
  }
}
