import { describe, expect, it } from 'vitest';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS } from '@content/world/screens';
import type { GameState } from '@core/state/gameState';
import { newGame } from '@core/state/gameState';
import type { DevBridge } from '@shell/dev/bridge';
import { installHook } from '@shell/dev/hook';
import { FrameStats } from '@shell/dev/stats';
import { FrameIndex } from '@shell/gfx/frameIndex';
import { SaveService } from '@shell/platform/saveService';
import { DEFAULT_SETTINGS } from '@shell/platform/settings';
import { Harness } from '../../sim/harness';

const NO_VIEW = {
  screens: 0,
  decor: 0,
  animatedDecor: 0,
  animatedTiles: 0,
  emitters: 0,
  openWater: 0,
  fishAlive: 0,
  fishJumps: 0,
};

/** `installHook` assumes a global `window`; the test provides a minimal one. */
function ensureWindow(): void {
  if (typeof globalThis.window === 'undefined') {
    (globalThis as unknown as { window: typeof globalThis }).window = globalThis;
  }
}

describe('installHook importSaveJson', () => {
  it('queues a private copy of the imported state for autosave, not the object the restarted Sim mutates', () => {
    ensureWindow();
    const h = new Harness();
    const saves = new SaveService(null, 'test', new Set<string>(SCREEN_IDS));
    const requested: GameState[] = [];
    const restarted: GameState[] = [];
    saves.autosaver.request = (state: GameState): void => {
      requested.push(state);
    };
    const b: DevBridge = {
      sim: h.sim,
      frames: new FrameIndex(),
      stats: new FrameStats(),
      settings: { ...DEFAULT_SETTINGS },
      saves,
      appliedGrade: () => [],
      lightLevel: () => 1,
      viewStats: () => NO_VIEW,
      jumpFish: () => undefined,
      tileAt: () => -1,
      restart: (state) => {
        restarted.push(state);
      },
    };
    installHook(() => b, {});
    const json = saves.exportJson(newGame(5, NEW_GAME));

    expect(window.__fimbul?.importSaveJson(json)).toBe('import_ok');
    expect(requested).toHaveLength(1);
    expect(restarted).toHaveLength(1);
    expect(requested[0]).toEqual(restarted[0]);
    expect(requested[0]).not.toBe(restarted[0]);
  });
});

describe('installHook warp', () => {
  it('rejects non-integer or NaN tile coordinates instead of teleporting off-grid', () => {
    ensureWindow();
    const h = new Harness();
    const b: DevBridge = {
      sim: h.sim,
      frames: new FrameIndex(),
      stats: new FrameStats(),
      settings: { ...DEFAULT_SETTINGS },
      saves: new SaveService(null, 'test', new Set<string>(SCREEN_IDS)),
      appliedGrade: () => [],
      lightLevel: () => 1,
      viewStats: () => NO_VIEW,
      jumpFish: () => undefined,
      tileAt: () => -1,
      restart: () => undefined,
    };
    installHook(() => b, {});
    expect(() => window.__fimbul?.warp('test_c', 20.5, 5)).toThrow('bad tile');
    expect(() => window.__fimbul?.warp('test_c', 20, NaN)).toThrow('bad tile');
    h.idle(1);
    expect(h.sim.screen.id).not.toBe('test_c');
  });
});
