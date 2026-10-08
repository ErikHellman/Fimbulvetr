import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ContentDb } from '@core/sim/db';
import { VINDR } from '@core/sim/systems/vindr';
import type { Thing } from '@core/world/screen';
import { Harness, frameOf } from './harness';
import { finishStory, talkTo } from './walk';

/** An open test_a with a web across (12, 10), held by `w_myr_web`. */
function webbed(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const things: Thing[] = [
    {
      k: 'gate',
      at: { x: 12, y: 10 },
      w: 1,
      h: 1,
      art: 'web',
      closed: { k: 'not', c: { k: 'flag', id: 'w_myr_web' } },
      blows: 'w_myr_web',
    },
  ];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

/** Reads on to a choice, takes the one at `pick`, and reads to the end. */
function choose(h: Harness, pick: number): void {
  const choosing = (): boolean => {
    const ui = h.sim.storyUi();
    return ui?.k === 'text' && ui.choices.length > 0;
  };
  for (let i = 0; i < 200 && !choosing(); i++) {
    if (h.sim.storyUi()?.k === 'save') h.sim.command({ t: 'saved' });
    h.step(frameOf([], ['confirm'])).idle(2);
  }
  if (!choosing()) throw new Error('no choice came');
  for (let i = 0; i < pick; i++) h.press(['down']);
  h.press(['confirm']);
  for (let i = 0; i < 300 && h.sim.mode !== 'play'; i++) {
    if (h.sim.storyUi()?.k === 'save') h.sim.command({ t: 'saved' });
    h.step(frameOf([], ['confirm'])).idle(2);
  }
}

describe('a web across the way', () => {
  it('is blown clear by a Vindr gust, for good', () => {
    const h = new Harness({ db: webbed(), tile: [8, 10], facing: 'e', season: 'summer' });
    h.sim.state.inv.galdr = ['vindr'];
    h.press(['galdr']).idle(VINDR.ticks);
    expect(h.sim.state.flags.w_myr_web).toBe(true);
  });

  it('turns the blade', () => {
    const h = new Harness({ db: webbed(), tile: [11, 10], facing: 'e', season: 'summer' });
    h.press(['sword']).idle(20);
    expect(h.sim.state.flags.w_myr_web).toBeUndefined();
  });
});

describe("the Norns' loom", () => {
  it('is reached by a dive at the whirlpool in the north water', () => {
    const h = new Harness({ preset: DEV_PRESETS.sae, screen: 'sae_well', tile: [20, 13], facing: 'n' });
    h.sim.state.clock.season = 'summer';
    h.sim.state.inv.items.sealskin = 1;
    h.idle(2);
    const door = DB.screens.sae_well.things.find((t) => t.k === 'door' && t.to === 'sae_int_well');
    expect(door?.k === 'door' && door.dive).toBe(true);
  });

  it('weaves the three threads into a seiðr vessel, and the hofs learn to turn the season', () => {
    const h = new Harness({ preset: DEV_PRESETS.sae, screen: 'sae_int_well', tile: [20, 14], facing: 'n' });
    h.idle(2);
    h.sim.state.inv.items.norn_thread = 3;
    const vessels = h.sim.state.inv.items.seidr_upgrade ?? 0;
    talkTo(h, 'urdr');
    expect(h.sim.state.flags.st_loom_woven).toBe(true);
    expect(h.sim.state.inv.items.norn_thread ?? 0).toBe(0);
    expect(h.sim.state.inv.items.seidr_upgrade).toBe(vessels + 1);
  });

  it('wants all three threads before it weaves', () => {
    const h = new Harness({ preset: DEV_PRESETS.sae, screen: 'sae_int_well', tile: [20, 14], facing: 'n' });
    h.idle(2);
    h.sim.state.inv.items.norn_thread = 2;
    talkTo(h, 'urdr');
    expect(h.sim.state.flags.st_loom_woven).toBeUndefined();
    expect(h.sim.state.flags.q_loom_asked).toBe(true);
    expect(h.sim.state.inv.items.norn_thread).toBe(2);
  });
});

describe('turning the season at a hof', () => {
  it('is offered after the prayer once the loom is woven, and restarts the season', () => {
    const h = new Harness({ preset: DEV_PRESETS.sae, screen: 'ask_int_hof', tile: [20, 9], facing: 'n' });
    h.sim.state.flags.st_loom_woven = true;
    h.sim.state.clock.season = 'autumn';
    h.sim.state.clock.seasonDay = 4;
    h.press(['interact']);
    choose(h, 0);
    expect(h.sim.state.clock.season).toBe('spring');
    expect(h.sim.state.clock.seasonDay).toBe(0);
  });

  it('is not offered before', () => {
    const h = new Harness({ preset: DEV_PRESETS.sae, screen: 'ask_int_hof', tile: [20, 9], facing: 'n' });
    h.sim.state.clock.season = 'autumn';
    h.press(['interact']);
    for (let i = 0; i < 300 && h.sim.mode !== 'play'; i++) {
      if (h.sim.storyUi()?.k === 'save') h.sim.command({ t: 'saved' });
      const ui = h.sim.storyUi();
      expect(ui?.k === 'text' ? ui.choices.length : 0).toBe(0);
      h.step(frameOf([], ['confirm'])).idle(2);
    }
    expect(h.sim.state.clock.season).toBe('autumn');
    finishStory(h);
  });
});
