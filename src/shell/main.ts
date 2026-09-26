import * as Phaser from 'phaser';
import { DB } from '@content/index';
import { GAME_TITLE } from '@content/meta';
import { NEW_GAME } from '@content/start';
import { newGame } from '@core/state/gameState';
import { showMessage } from '@shell/boot/message';
import { hasWebGL } from '@shell/boot/webgl';
import { GAME_H, GAME_W, attachZoom } from '@shell/scale';
import { BootScene } from '@shell/scenes/BootScene';
import { PlayScene } from '@shell/scenes/PlayScene';
import type { Services } from '@shell/services';

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
}

function startGame(services: Services): void {
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
    scene: [new BootScene(services), new PlayScene()],
  });
  attachZoom(game, () => 'integer');
}

document.title = GAME_TITLE;
if (!hasWebGL()) {
  showMessage('Fimbulvetr needs WebGL, which this browser has turned off or does not support.');
} else {
  startGame({ db: DB, state: newGame(randomSeed(), NEW_GAME) });
}
