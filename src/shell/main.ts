import * as Phaser from 'phaser';
import { DB } from '@content/index';
import { GAME_TITLE } from '@content/meta';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS } from '@content/world/screens';
import { applyDevQuery, parseDevQuery } from '@core/dev/query';
import { newGame } from '@core/state/gameState';
import { showMessage } from '@shell/boot/message';
import { hasWebGL } from '@shell/boot/webgl';
import { GAME_H, GAME_W, attachZoom } from '@shell/scale';
import { BootScene } from '@shell/scenes/BootScene';
import { PlayScene } from '@shell/scenes/PlayScene';
import type { Services } from '@shell/services';

/**
 * Dev tools and the test hook exist only in `pnpm dev` and `--mode test` builds. Kept in this module so
 * Vite's `import.meta.env` replacement lets the minifier drop the dynamic import from production.
 */
const DEV_TOOLS = import.meta.env.DEV || import.meta.env.MODE === 'test';

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
  game.canvas.setAttribute('aria-label', GAME_TITLE);
  attachZoom(game, () => 'integer');
}

async function main(): Promise<void> {
  document.title = GAME_TITLE;
  const query = DEV_TOOLS ? parseDevQuery(window.location.search, new Set<string>(SCREEN_IDS)) : null;
  for (const warning of query?.warnings ?? []) console.warn(`[dev] ${warning}`);
  if (!hasWebGL()) {
    showMessage('Fimbulvetr needs WebGL, which this browser has turned off or does not support.');
    return;
  }
  const state = newGame(query?.seed ?? randomSeed(), NEW_GAME);
  if (query !== null) applyDevQuery(state, query);
  const dev = DEV_TOOLS ? (await import('@shell/dev/index')).createDevTools() : null;
  startGame({ db: DB, state, dev });
}

void main();
