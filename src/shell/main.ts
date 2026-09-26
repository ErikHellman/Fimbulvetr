import * as Phaser from 'phaser';
import { UI } from '@content/i18n/ui';
import { DB } from '@content/index';
import { GAME_TITLE } from '@content/meta';
import { DEV_PRESETS, isDevPresetId } from '@content/dev/presets';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS } from '@content/world/screens';
import { applyDevQuery, applyPreset, parseDevQuery } from '@core/dev/query';
import { t } from '@core/i18n/t';
import { newGame } from '@core/state/gameState';
import { showMessage } from '@shell/boot/message';
import { hasWebGL } from '@shell/boot/webgl';
import { SaveService } from '@shell/platform/saveService';
import { registerServiceWorker } from '@shell/platform/pwa';
import { openSaveStoreSafely } from '@shell/platform/saveStore';
import { browserStorage, loadSettings, preferredLang } from '@shell/platform/settings';
import { acquireTabLock } from '@shell/platform/tabLock';
import { GAME_H, GAME_W, attachZoom } from '@shell/scale';
import { BootScene } from '@shell/scenes/BootScene';
import { PlayScene } from '@shell/scenes/PlayScene';
import { UiScene } from '@shell/scenes/UiScene';
import type { Services } from '@shell/services';

/**
 * Dev tools and the test hook exist only in `pnpm dev` and `--mode test` builds. Kept in this module so
 * Vite's `import.meta.env` replacement lets the minifier drop the dynamic import from production.
 */
const DEV_TOOLS = import.meta.env.DEV || import.meta.env.MODE === 'test';

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
}

function indexedDbFactory(): IDBFactory | undefined {
  try {
    return window.indexedDB;
  } catch {
    return undefined;
  }
}

function startGame(services: Services, extra: readonly Phaser.Scene[]): void {
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
    scene: [new BootScene(services), new PlayScene(), new UiScene(), ...extra],
  });
  game.canvas.setAttribute('aria-label', GAME_TITLE);
  attachZoom(game, () => services.settings.scaling);
}

async function main(): Promise<void> {
  document.title = GAME_TITLE;
  const query = DEV_TOOLS
    ? parseDevQuery(window.location.search, new Set<string>(SCREEN_IDS), new Set(Object.keys(DEV_PRESETS)))
    : null;
  for (const warning of query?.warnings ?? []) console.warn(`[dev] ${warning}`);
  const settings = loadSettings(browserStorage(), preferredLang(navigator.languages));
  if (query?.lang !== undefined) settings.lang = query.lang;
  const lang = settings.lang;
  document.documentElement.lang = lang;

  if (!hasWebGL()) {
    showMessage(t(UI.webgl_required, lang));
    return;
  }
  if (!(await acquireTabLock(navigator.locks))) {
    showMessage(t(UI.already_open, lang));
    return;
  }
  if (!import.meta.env.DEV) registerServiceWorker(lang);

  const wantSaves = query?.nosave !== true;
  const store = wantSaves ? await openSaveStoreSafely(indexedDbFactory()) : null;
  if (wantSaves && store === null) {
    showMessage(t(UI.storage_unavailable, lang), [{ label: t(UI.ok, lang), run: () => undefined }]);
  }
  const saves = new SaveService(store, __BUILD_ID__, new Set<string>(SCREEN_IDS));
  const fresh = query?.screen !== undefined || query?.preset !== undefined;
  const loaded = fresh ? null : await saves.loadAuto();
  const state = loaded ?? newGame(query?.seed ?? randomSeed(), NEW_GAME);
  if (query?.preset !== undefined && isDevPresetId(query.preset))
    applyPreset(state, DEV_PRESETS[query.preset]);
  if (query !== null) applyDevQuery(state, query);
  const dev = DEV_TOOLS ? (await import('@shell/dev/index')).createDevTools() : null;
  const gallery = query?.gallery === true ? new (await import('@shell/dev/gallery')).GalleryScene() : null;
  startGame(
    {
      db: DB,
      state,
      settings,
      saves,
      dev,
      muted: query?.mute === true,
      start: gallery === null ? 'play' : 'gallery',
    },
    gallery === null ? [] : [gallery],
  );
}

void main();
