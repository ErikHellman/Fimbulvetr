import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import { questLog } from '@core/story/quests';
import { applyEffect } from '@core/story/effects';
import { Harness } from './harness';
import { crossTo, fightNear, talkTo, walkTo } from './walk';

const NIGHT = 23 * 60;

/** In Hrafn's hut, with the trade done and the fog behind (as after M6a). */
function inTheHut(): Harness {
  const h = new Harness({
    preset: DEV_PRESETS.fimbul,
    screen: 'nif_int_hut',
    tile: [19, 13],
    season: 'summer',
  });
  Object.assign(h.sim.state.flags, {
    st_rime_open: true,
    st_niflmyrr_reached: true,
    n_hrafn_met: true,
    q_trade: 4,
  });
  return h;
}

const marbendill = (h: Harness) => h.sim.enemies.find((e) => e.def === 'marbendill');
const quest = (h: Harness) =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_sealskin');

/** Out of the hut onto the strand at night, waiting for it to climb out, and fighting it off. */
function guardTheNets(h: Harness): void {
  h.sim.state.clock.minute = NIGHT;
  walkTo(h, 19, 14);
  crossTo(h, 's', 'nif_shore');
  expect(marbendill(h)).toBeDefined();
  walkTo(h, 12, 12);
  for (let i = 0; i < 100 && marbendill(h) !== undefined; i++) {
    fightNear(h, 200, 60);
    h.idle(1);
  }
  expect(marbendill(h)).toBeUndefined();
}

describe('the seal-skin', () => {
  it('is Hrafn’s, given after three nights guarding his nets from the marbendill', () => {
    const h = inTheHut();
    talkTo(h, 'hrafn');
    expect(h.sim.state.flags.q_sealskin_asked).toBe(true);
    expect(quest(h)?.done).toBe(false);

    for (let night = 1; night <= 3; night++) {
      guardTheNets(h);
      expect(h.sim.state.flags.q_seal_nights).toBe(night);
      expect(h.sim.state.flags.ev_seal_tonight).toBe(true);
      // Driven off for tonight: the strand stays quiet until the next night.
      walkTo(h, 19, 10);
      h.hold(['up'], 60).idle(40);
      expect(h.sim.screen.id).toBe('nif_int_hut');
      walkTo(h, 19, 14);
      crossTo(h, 's', 'nif_shore');
      expect(marbendill(h)).toBeUndefined();
      walkTo(h, 19, 10);
      h.hold(['up'], 60).idle(40);
      applyEffect({ k: 'sleep', until: 8 * 60 }, h.sim);
      expect(h.sim.state.flags.ev_seal_tonight).toBe(false);
    }

    talkTo(h, 'hrafn');
    expect(h.sim.state.inv.items.sealskin).toBe(1);
    expect(h.sim.state.flags.q_sealskin_done).toBe(true);
    expect(quest(h)?.done).toBe(true);
    // No fourth night.
    h.sim.state.flags.ev_seal_tonight = false;
    h.sim.state.clock.minute = NIGHT;
    walkTo(h, 19, 14);
    crossTo(h, 's', 'nif_shore');
    expect(marbendill(h)).toBeUndefined();
  });

  it('does not bring the marbendill by day, or before Ask has offered', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul, screen: 'nif_shore', tile: [20, 14], minute: NIGHT });
    expect(marbendill(h)).toBeUndefined();
    const d = new Harness({
      preset: DEV_PRESETS.fimbul,
      screen: 'nif_shore',
      tile: [20, 14],
      minute: 12 * 60,
    });
    d.sim.state.flags.q_sealskin_asked = true;
    d.sim.command({ t: 'warp', screen: 'nif_shore', x: 20 * 16 + 8, y: 14 * 16 + 14 });
    d.idle(1);
    expect(marbendill(d)).toBeUndefined();
  });
});
