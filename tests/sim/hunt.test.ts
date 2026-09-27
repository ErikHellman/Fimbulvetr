import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { FlagId } from '@content/flags';
import type { ScreenId } from '@content/world/screens';
import { questLog } from '@core/story/quests';
import { DB } from '@content/index';
import { Harness } from './harness';
import { face, finishStory, interactNorth, talkTo, walkTo } from './walk';

const at = (screen: ScreenId, tile: readonly [number, number], flags: readonly FlagId[] = []): Harness => {
  const h = new Harness({ preset: DEV_PRESETS.uppvik, screen, tile });
  for (const f of flags) h.sim.state.flags[f] = true;
  // Enter the screen afresh, so its things see the flags.
  h.sim.command({ t: 'warp', screen, x: tile[0] * 16 + 8, y: tile[1] * 16 + 14 });
  h.idle(2);
  return h;
};

const foes = (h: Harness) => h.sim.enemies.map((e) => e.def).sort();
const stage = (h: Harness) =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_vargar')?.text.en;

describe('the vargar hunt', () => {
  it('starts with the hunters’ notice on the Þing-stone', () => {
    const h = at('upp_square', [26, 14]);
    interactNorth(h, 26, 12);
    finishStory(h);
    expect(h.sim.state.flags.q_vargar_taken).toBe(true);
    expect(stage(h)).toMatch(/pack leader/);
    // Read again, the notice is gone.
    interactNorth(h, 26, 12).idle(2);
    expect(h.sim.storyUi()).toMatchObject({ k: 'text', choices: [] });
    finishStory(h);
  });

  it('puts the pack leader on the north road while the hunt is on, until it falls', () => {
    const before = at('myr_north', [19, 18]);
    expect(foes(before)).toEqual(['vargr']);
    const h = at('myr_north', [19, 18], ['q_vargar_taken']);
    expect(foes(h)).toEqual(['vargr', 'vargr', 'vargr', 'vargr_alpha']);
    h.sim.command({ t: 'killAll' });
    h.idle(2);
    expect(h.sim.state.flags.q_vargar_alpha).toBe(true);
    h.sim.command({ t: 'warp', screen: 'myr_north', x: 19 * 16 + 8, y: 18 * 16 + 14 });
    h.idle(2);
    expect(foes(h)).toEqual(['vargr']);
  });

  it('Dagný tells how the leader fights', () => {
    const h = at('myr_road', [28, 9], ['n_dagny_met', 'q_vargar_taken']);
    talkTo(h, 'dagny');
    expect(h.sim.state.flags.q_vargar_tracked).toBe(true);
    expect(stage(h)).toMatch(/mid-howl/);
  });

  it('Bersi pays the bounty: a purse that holds 300, and 60 silver', () => {
    const h = at('upp_gate', [22, 9], ['n_bersi_met', 'q_vargar_taken', 'q_vargar_alpha']);
    h.sim.state.hero.silver = 90;
    // He stands with his back to the palisade: step up from the west.
    walkTo(h, 23, 11);
    face(h, 'e');
    h.press(['interact']);
    finishStory(h);
    expect(h.sim.state.flags.q_vargar_done).toBe(true);
    expect(h.sim.state.hero.purse).toBe(1);
    expect(h.sim.state.hero.silver).toBe(150);
    expect(stage(h)).toMatch(/300 silver/);
  });
});
