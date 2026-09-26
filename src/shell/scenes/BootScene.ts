import * as Phaser from 'phaser';
import { buildSprites } from '@art/sprites';
import { buildTileset } from '@art/tiles/tileset';
import { registerSfx } from '@shell/audio/sfx';
import { registerFont } from '@shell/gfx/font';
import { registerSprites, registerTileset } from '@shell/gfx/textures';
import type { PlayData, Services } from '@shell/services';

/** Generates all placeholder art into textures, then starts play. */
export class BootScene extends Phaser.Scene {
  constructor(private readonly services: Services) {
    super('boot');
  }

  create(): void {
    registerSfx(this);
    registerFont(this);
    const frames = registerSprites(this.textures, buildSprites());
    const tileset = buildTileset();
    registerTileset(this.textures, tileset);
    const data: PlayData = { ...this.services, assets: { frames, tileset } };
    this.scene.start(this.services.start, data);
  }
}
