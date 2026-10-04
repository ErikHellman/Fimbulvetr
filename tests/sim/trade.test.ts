import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import { questLog } from '@core/story/quests';
import { tileFeet } from '@core/world/screen';
import { Harness } from './harness';
import { finishStory, interactNorth, talkTo } from './walk';

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

const trade = (h: Harness) =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_trade');

describe('the trading chain, steps 1–3', () => {
  it('runs from Ulf’s bell in the ashes of the fold to Gamli’s bone hook', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul });
    Object.assign(h.sim.state.flags, {
      st_home_winter: true,
      n_hildr_met: true,
      n_jorunn_met: true,
      n_kari_met: true,
    });
    // Read afresh each time: the bag is replaced as it changes.
    const items = () => h.sim.state.inv.items;
    expect(trade(h)).toBeUndefined();

    warp(h, 'ask_pasture', 6, 14);
    interactNorth(h, 6, 9);
    expect(h.sim.mode).toBe('story');
    finishStory(h);
    expect(items().trade_bell).toBe(1);
    expect(trade(h)?.done).toBe(false);
    // Found once.
    interactNorth(h, 6, 9);
    expect(h.sim.mode).toBe('play');

    warp(h, 'hau_heath', 17, 12);
    talkTo(h, 'hildr');
    expect([items().trade_bell ?? 0, items().trade_fleece]).toEqual([0, 1]);
    expect(h.sim.state.flags.q_trade).toBe(1);

    warp(h, 'upp_square', 12, 16);
    talkTo(h, 'jorunn');
    expect([items().trade_fleece ?? 0, items().trade_yarn]).toEqual([0, 1]);
    expect(h.sim.state.flags.q_trade).toBe(2);

    warp(h, 'myl_fisher', 23, 14);
    talkTo(h, 'kari');
    expect([items().trade_yarn ?? 0, items().trade_hook]).toEqual([0, 1]);
    expect(h.sim.state.flags.q_trade).toBe(3);
    expect(trade(h)?.done).toBe(false);
    expect(trade(h)?.text.en).toContain('seal-hunter');
  });

  it('has nothing in the ashes before the raid', () => {
    const h = new Harness({ preset: DEV_PRESETS.day2 });
    warp(h, 'ask_pasture', 6, 14);
    interactNorth(h, 6, 9);
    expect(h.sim.mode).toBe('play');
  });
});
