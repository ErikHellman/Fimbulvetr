import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { Harness } from './harness';
import { finishStory, interactNorth } from './walk';

const shopRows = (h: Harness): string[] => {
  const ui = h.sim.storyUi();
  return ui?.k === 'shop' ? ui.rows.map((r) => ('item' in r.ware ? r.ware.item : '?')) : [];
};

/** Reads on until the shop opens (or the talk ends), returning the rows on offer. */
function visitHeidr(h: Harness): string[] {
  interactNorth(h, 22, 12);
  for (let i = 0; i < 60 && h.sim.storyUi()?.k !== 'shop'; i++) h.press(['confirm']);
  const rows = shopRows(h);
  finishStory(h);
  return rows;
}

describe('Heiðr the völva', () => {
  it('gives a horn on meeting, brews red and green, and blue for three fen-moss', () => {
    const h = new Harness({ preset: DEV_PRESETS.uppvik, screen: 'myr_int_volva', tile: [22, 14] });
    h.idle(2);
    const horns = h.sim.state.inv.items.horn ?? 0;
    expect(visitHeidr(h)).toEqual(['mead_red', 'mead_green']);
    expect(h.sim.state.inv.items.horn).toBe(horns + 1);
    expect(h.sim.state.flags.q_volva_asked).toBe(true);
    // Two clumps are not enough.
    h.sim.state.inv.items.fen_moss = 2;
    visitHeidr(h);
    expect(h.sim.state.flags.q_volva_done).toBeUndefined();
    h.sim.state.inv.items.fen_moss = 3;
    expect(visitHeidr(h)).toEqual(['mead_red', 'mead_green', 'mead_blue']);
    expect(h.sim.state.flags.q_volva_done).toBe(true);
    expect(h.sim.state.inv.items.fen_moss ?? 0).toBe(0);
    expect(h.sim.state.inv.items.horn).toBe(horns + 1);
  });
});

describe('the huldra', () => {
  const glade = (minute: number) =>
    new Harness({ preset: DEV_PRESETS.uppvik, screen: 'myr_glade', tile: [20, 15], minute });
  const huldra = (h: Harness) => h.sim.actors.find((a) => a.kind === 'npc' && a.def === 'huldra');

  /** Walks up behind her, talks, and reads on to her choice; picks `pick` (0 promise, 1 refuse). */
  function bargain(h: Harness, pick: number): void {
    interactNorth(h, 20, 11);
    const choosing = (): boolean => {
      const ui = h.sim.storyUi();
      return ui?.k === 'text' && ui.choices.length > 0;
    };
    for (let i = 0; i < 60 && !choosing(); i++) h.press(['confirm']);
    for (let i = 0; i < pick; i++) h.press(['down']);
    h.press(['confirm']);
    finishStory(h);
  }

  it('is only in the glade at night, her back to the path', () => {
    const day = glade(12 * 60);
    day.idle(2);
    expect(huldra(day)).toBeUndefined();
    const night = glade(23 * 60);
    night.idle(2);
    expect(huldra(night)?.facing).toBe('n');
  });

  it('asks again after a refusal, and gives the winter cloak for a promise', () => {
    const h = glade(23 * 60);
    h.idle(2);
    bargain(h, 1);
    expect(h.sim.state.flags.q_huldra_refused).toBe(true);
    expect(h.sim.state.inv.items.winter_cloak).toBeUndefined();
    bargain(h, 0);
    expect(h.sim.state.flags.q_huldra_promise).toBe(true);
    expect(h.sim.state.inv.items.winter_cloak).toBe(1);
  });
});
