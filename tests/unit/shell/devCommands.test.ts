import { describe, expect, it } from 'vitest';
import type { DevBridge } from '@shell/dev/bridge';
import { runCommand } from '@shell/dev/commands';
import { FrameStats } from '@shell/dev/stats';
import { FrameIndex } from '@shell/gfx/frameIndex';
import { DEFAULT_SETTINGS } from '@shell/platform/settings';
import { Harness } from '../../sim/harness';

function bridge(): { b: DevBridge; h: Harness } {
  const h = new Harness();
  const b: DevBridge = {
    sim: h.sim,
    frames: new FrameIndex(),
    stats: new FrameStats(),
    settings: { ...DEFAULT_SETTINGS },
    appliedGrade: () => [],
    lightLevel: () => 1,
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

  it('explains mistakes', () => {
    const { b } = bridge();
    expect(run(b, 'warp nowhere')).toBe("unknown screen 'nowhere'");
    expect(run(b, 'season monsoon')).toBe("unknown season 'monsoon'");
    expect(run(b, 'time soon')).toBe('usage: time HH:MM | day | night');
    expect(run(b, 'flag nope 1')).toBe("unknown flag 'nope'");
    expect(run(b, 'dance')).toBe("unknown command 'dance' — try help");
  });

  it('changes the language', () => {
    const { b } = bridge();
    expect(run(b, 'lang sv')).toBe('language sv');
    expect(b.settings.lang).toBe('sv');
    expect(run(b, 'lang de')).toBe('languages: en, sv');
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
