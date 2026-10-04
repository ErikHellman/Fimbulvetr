import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import { applyEffect } from '@core/story/effects';
import { Harness } from './harness';

/** Flags marked `dawn` hold for one night (or one day's deed) and clear at sunrise or on waking. */
describe('dawn flags', () => {
  it('clear at sunrise, and nothing else does', () => {
    const sunrise = DB.clock.sunrise.summer;
    const h = new Harness({
      preset: DEV_PRESETS.fimbul,
      screen: 'nif_shore',
      tile: [20, 14],
      season: 'summer',
    });
    h.sim.state.clock.minute = sunrise - 1;
    h.sim.state.flags.ev_seal_tonight = true;
    h.sim.state.flags.q_sealskin_asked = true;
    h.idle(DB.clock.ticksPerMinute - 2);
    expect(h.sim.state.flags.ev_seal_tonight).toBe(true);
    h.idle(4);
    expect(h.sim.state.flags.ev_seal_tonight).toBe(false);
    expect(h.sim.state.flags.q_sealskin_asked).toBe(true);
  });

  it('clear on waking from sleep', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul, screen: 'nif_shore', tile: [20, 14] });
    h.sim.state.flags.ev_seal_tonight = true;
    applyEffect({ k: 'sleep', until: 8 * 60 }, h.sim);
    expect(h.sim.state.flags.ev_seal_tonight).toBe(false);
  });
});
