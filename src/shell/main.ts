import * as Phaser from 'phaser';
import { GAME_TITLE } from '@content/meta';
import { showMessage } from '@shell/boot/message';
import { hasWebGL } from '@shell/boot/webgl';
import { GAME_H, GAME_W } from '@shell/scale';
import { BootScene } from '@shell/scenes/BootScene';

document.title = GAME_TITLE;

if (!hasWebGL()) {
  showMessage('Fimbulvetr needs WebGL, which this browser has turned off or does not support.');
} else {
  const game = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: 'game',
    width: GAME_W,
    height: GAME_H,
    pixelArt: true,
    backgroundColor: '#000000',
    banner: false,
    scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.NO_CENTER },
    input: { keyboard: false, gamepad: false },
    scene: [BootScene],
  });
  game.canvas.setAttribute('aria-label', GAME_TITLE);
}
