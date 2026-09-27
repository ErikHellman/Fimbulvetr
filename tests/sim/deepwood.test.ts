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
