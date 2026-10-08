import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import { questLog } from '@core/story/quests';
import { tileFeet } from '@core/world/screen';
import { Harness } from './harness';
import { finishStory, interactNorth, walkTo } from './walk';

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

const stage = (h: Harness): string | undefined =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_act2')?.text.en;

describe('Helgrind', () => {
  it('opens from the gate in Niflmýrr: in through the black wall, and the act II quest moves on', () => {
    const h = new Harness({ preset: DEV_PRESETS.d4 });
    warp(h, 'nif_gate', 20, 7);
    walkTo(h, 20, 5);
    h.until((s) => s.screen.id === 'd4_r01', 120, h.frame(['up']));
    h.until((s) => s.mode === 'story', 200, h.frame(['up']));
    finishStory(h);
    expect(h.sim.state.flags.st_d4_entered).toBe(true);
    expect(stage(h)).toMatch(/Inside Helgrind/);
  });

  it('gives three Ís staves from the rack to an empty hand, and none to a full one', () => {
    const h = new Harness({ preset: DEV_PRESETS.d4 });
    delete h.sim.state.inv.items.stave_is;
    warp(h, 'd4_r06', 20, 9);
    interactNorth(h, 20, 5).idle(1);
    finishStory(h);
    expect(h.sim.state.inv.items.stave_is).toBe(3);
    interactNorth(h, 20, 5).idle(1);
    expect(h.sim.mode).toBe('play');
    expect(h.sim.state.inv.items.stave_is).toBe(3);
  });

  it('frees the captives when Náströnd falls, and Kolbeinn speaks once past his hall', () => {
    const h = new Harness({ preset: DEV_PRESETS.d4boss });
    h.sim.command({ t: 'god', on: true });
    warp(h, 'd4_r21', 20, 17);
    expect(h.sim.actors.some((a) => a.kind === 'enemy' && a.def === 'nastrond')).toBe(true);
    h.sim.command({ t: 'killAll' });
    h.until((s) => s.state.flags.st_d4_boss_dead === true, 600);
    if (h.sim.mode !== 'play') finishStory(h);
    expect(h.sim.state.flags).toMatchObject({
      st_thane_nastrond: true,
      st_freed_ulf: true,
      st_freed_tofa: true,
      q_thanes: 1,
      q_captives: 2,
    });
    expect(stage(h)).toMatch(/One thane down, three to go/);
    warp(h, 'd4_r22', 4, 10);
    h.idle(2);
    expect(h.sim.mode).toBe('story');
    finishStory(h);
    expect(h.sim.state.flags.st_d4_kolbeinn).toBe(true);
    warp(h, 'd4_r22', 4, 10);
    expect(h.sim.mode).toBe('play');
    // The rune-stone takes Ask back out to the gate.
    interactNorth(h, 20, 6);
    finishStory(h);
    expect(h.sim.screen.id).toBe('nif_gate');
  });
});
