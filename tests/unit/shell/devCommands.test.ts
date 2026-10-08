import { describe, expect, it, vi } from 'vitest';
import { SCREEN_IDS } from '@content/world/screens';
import type { GameState } from '@core/state/gameState';
import type { DevBridge } from '@shell/dev/bridge';
import { runCommand } from '@shell/dev/commands';
import { FrameStats } from '@shell/dev/stats';
import { pickSaveFile } from '@shell/platform/exportImport';
import { FrameIndex } from '@shell/gfx/frameIndex';
import { SaveService } from '@shell/platform/saveService';
import { DEFAULT_SETTINGS } from '@shell/platform/settings';
import { Harness } from '../../sim/harness';

vi.mock('@shell/platform/exportImport', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shell/platform/exportImport')>();
  return { ...actual, pickSaveFile: vi.fn<() => Promise<string | null>>() };
});

function bridge(): { b: DevBridge; h: Harness } {
  const h = new Harness();
  const b: DevBridge = {
    sim: h.sim,
    frames: new FrameIndex(),
    stats: new FrameStats(),
    settings: { ...DEFAULT_SETTINGS },
    saves: new SaveService(null, 'test', new Set()),
    appliedGrade: () => [],
    lightLevel: () => 1,
    viewStats: () => ({
      screens: 0,
      decor: 0,
      animatedDecor: 0,
      animatedTiles: 0,
      emitters: 0,
      openWater: 0,
      fishAlive: 0,
      fishJumps: 0,
      rain: 0,
      snow: 0,
      leaves: 0,
      fog: 0,
      flames: 0,
      ghosts: 0,
      chain: 0,
      ward: 0,
      bolts: 0,
      dark: 0,
      lights: 0,
    }),
    jumpFish: () => undefined,
    tileAt: () => -1,
    coverAt: () => -1,
    menu: () => null,
    picker: () => null,
    restart: () => undefined,
  };
  return { b, h };
}

const run = (b: DevBridge, line: string): string => runCommand(b, line, () => undefined);

describe('dev console commands', () => {
  it('warps, sets time, season and flags through sim commands', () => {
    const { b, h } = bridge();
    expect(run(b, 'warp test_c 20 5')).toBe('warped to test_c 20,5');
    expect(run(b, 'time 21:15')).toBe('time 21:15');
    expect(run(b, 'season winter')).toBe('season winter');
    expect(run(b, 'flag st_intro_seen true')).toBe('flag st_intro_seen = true');
    h.idle(1);
    expect(h.sim.screen.id).toBe('test_c');
    expect(h.sim.state.clock).toMatchObject({ minute: 21 * 60 + 15, season: 'winter' });
    expect(h.sim.state.flags.st_intro_seen).toBe(true);
  });

  it('gives items, sets health, forces weather and kills through dev commands', () => {
    const { b, h } = bridge();
    expect(run(b, 'give lantern')).toBe('gave 1 lantern');
    expect(run(b, 'give flatbread 3')).toBe('gave 3 flatbread');
    expect(run(b, 'hp 5')).toBe('hp 5');
    expect(run(b, 'weather storm')).toBe('weather storm');
    h.idle(1);
    expect(h.sim.state.inv.items).toMatchObject({ lantern: 1, flatbread: 3 });
    expect(h.sim.hero.hp).toBe(5);
    expect(h.sim.weather()).toBe('storm');
    expect(run(b, 'weather off')).toBe('weather follows the story');
    h.idle(1);
    expect(h.sim.weather()).toBe('clear');
    expect(run(b, 'give nothing')).toBe("unknown item 'nothing'");
    expect(run(b, 'weather monsoon')).toMatch(/^weather: clear, rain/);
  });

  it('readies an item in a slot, or empties one', () => {
    const { b, h } = bridge();
    run(b, 'give lantern');
    h.idle(1);
    expect(run(b, 'slot 2 lantern')).toBe('slot 2: lantern');
    h.idle(1);
    expect(h.sim.state.inv.slots[1]).toBe('lantern');
    expect(run(b, 'slot 2 none')).toBe('slot 2: none');
    h.idle(1);
    expect(h.sim.state.inv.slots[1]).toBeNull();
    expect(run(b, 'slot 3 lantern')).toBe('usage: slot <1|2> <item|none>');
    expect(run(b, 'slot 1 nothing')).toBe("unknown item 'nothing'");
  });

  it('switches god mode on and off without leaving a trace in the hash', () => {
    const { b, h } = bridge();
    const before = h.sim.hash();
    expect(run(b, 'god')).toBe('god on');
    h.sim.flushCommands();
    expect(h.sim.god).toBe(true);
    expect(h.sim.hash()).not.toBe(before);
    expect(run(b, 'god off')).toBe('god off');
    h.sim.flushCommands();
    expect(h.sim.god).toBeUndefined();
    expect(h.sim.hash()).toBe(before);
  });

  it('explains mistakes', () => {
    const { b } = bridge();
    expect(run(b, 'warp nowhere')).toBe("unknown screen 'nowhere'");
    expect(run(b, 'season monsoon')).toBe("unknown season 'monsoon'");
    expect(run(b, 'time soon')).toBe('usage: time HH:MM | day | night');
    expect(run(b, 'flag nope 1')).toBe("unknown flag 'nope'");
    expect(run(b, 'dance')).toBe("unknown command 'dance' — try help");
  });

  it('rejects non-integer or NaN warp coordinates instead of teleporting off-grid', () => {
    const { b, h } = bridge();
    expect(run(b, 'warp test_c 20.5 5')).toBe('usage: warp <screen> [x y]');
    expect(run(b, 'warp test_c 20 soon')).toBe('usage: warp <screen> [x y]');
    h.idle(1);
    expect(h.sim.screen.id).not.toBe('test_c');
  });

  it('changes the language', () => {
    const { b } = bridge();
    expect(run(b, 'lang sv')).toBe('language sv');
    expect(b.settings.lang).toBe('sv');
    expect(run(b, 'lang de')).toBe('languages: en, sv');
  });

  it('queues a private copy of an imported save for autosave, not the object handed to restart', async () => {
    const { h } = bridge();
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
      viewStats: () => ({
        screens: 0,
        decor: 0,
        animatedDecor: 0,
        animatedTiles: 0,
        emitters: 0,
        openWater: 0,
        fishAlive: 0,
        fishJumps: 0,
        rain: 0,
        snow: 0,
        leaves: 0,
        fog: 0,
        flames: 0,
        ghosts: 0,
        chain: 0,
        ward: 0,
        bolts: 0,
        dark: 0,
        lights: 0,
      }),
      jumpFish: () => undefined,
      tileAt: () => -1,
      coverAt: () => -1,
      menu: () => null,
      picker: () => null,
      restart: (state) => {
        restarted.push(state);
      },
    };
    const json = saves.exportJson(h.sim.snapshot());
    vi.mocked(pickSaveFile).mockResolvedValueOnce(json);

    expect(run(b, 'import')).toBe('choose a save file…');
    await vi.waitFor(() => {
      expect(restarted).toHaveLength(1);
    });

    expect(requested).toHaveLength(1);
    expect(requested[0]).toEqual(restarted[0]);
    expect(requested[0]).not.toBe(restarted[0]);
  });
});

describe('FrameStats', () => {
  it('summarises fps and the 95th percentile frame time', () => {
    const stats = new FrameStats();
    for (let i = 0; i < 100; i++) stats.record(i < 95 ? 16 : 40, 0.1);
    const s = stats.summary();
    expect(s.p95).toBe(40);
    expect(s.fps).toBeGreaterThan(50);
    expect(s.simMs).toBe(0.1);
  });
});
