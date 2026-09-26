import * as Phaser from 'phaser';
import type { PlayData } from '@shell/services';
import { TILESET_KEY } from '@shell/gfx/textures';

const CELL_W = 80;
const CELL_H = 64;
const COLS = 8;

/**
 * `?dev=gallery`: every generated frame and tile with its name, for reviewing placeholder art.
 * Arrow keys or the mouse wheel scroll. Dev and test builds only.
 */
export class GalleryScene extends Phaser.Scene {
  constructor() {
    super('gallery');
  }

  create(data: PlayData): void {
    const names = data.assets.frames.names();
    names.forEach((name, i) => {
      const ref = data.assets.frames.get(name);
      const x = (i % COLS) * CELL_W + CELL_W / 2;
      const y = Math.floor(i / COLS) * CELL_H + 40;
      this.add.sprite(x, y, ref.key, ref.frame).setOrigin(ref.ox, ref.oy);
      this.add
        .text(x, y + 6, name.replace(/_/g, ' '), {
          fontFamily: 'monospace',
          fontSize: '7px',
          color: '#dddddd',
        })
        .setOrigin(0.5, 0)
        .setWordWrapWidth(CELL_W - 4);
    });
    const tilesTop = Math.ceil(names.length / COLS) * CELL_H + 40;
    const source = this.textures.get(TILESET_KEY).getSourceImage();
    this.add.image(0, tilesTop, TILESET_KEY).setOrigin(0, 0);
    const bottom = tilesTop + source.height + 20;
    const cam = this.cameras.main;
    cam.setBackgroundColor('#2a2a33');
    cam.setBounds(0, 0, COLS * CELL_W, bottom);
    const scroll = (dy: number): void => {
      cam.scrollY = Phaser.Math.Clamp(cam.scrollY + dy, 0, Math.max(0, bottom - cam.height));
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') scroll(CELL_H);
      if (e.code === 'ArrowUp' || e.code === 'KeyW') scroll(-CELL_H);
      if (e.code === 'PageDown') scroll(cam.height);
      if (e.code === 'PageUp') scroll(-cam.height);
    };
    const onWheel = (e: WheelEvent): void => {
      scroll(e.deltaY);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
    });
    document.body.dataset.ready = 'true';
    document.body.dataset.gallery = String(names.length);
  }
}
