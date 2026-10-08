import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { FOG_RADIUS, LANTERN_FOG_RADIUS, MIST_DARK, NIGHT_DARK } from '@core/world/light';
import { Harness } from './harness';

/** Niflmýrr's gorge on a clear day, with the lantern left at home. */
function inTheMarsh(minute = 12 * 60): Harness {
  const h = new Harness({ preset: DEV_PRESETS.fimbul, screen: 'nif_gorge', tile: [20, 14], minute });
  h.sim.state.flags.st_rime_open = true;
  return h;
}

describe('Niflmýrr’s fog', () => {
  it('hangs over the marsh on a clear day, and the lantern only widens the clear air', () => {
    const h = inTheMarsh();
    h.sim.state.inv.items.lantern = 0;
    expect(h.sim.weather()).toBe('clear');
    expect(h.sim.fog().amount).toBeGreaterThan(0);
    expect(h.sim.fog().r).toBe(FOG_RADIUS);
    h.sim.state.inv.items.lantern = 1;
    expect(h.sim.fog().r).toBe(LANTERN_FOG_RADIUS);
  });

  it('lies under the snow in winter too', () => {
    const h = inTheMarsh();
    h.sim.command({ t: 'weather', kind: 'snow' });
    h.idle(1);
    expect(h.sim.weather()).toBe('snow');
    expect(h.sim.fog().amount).toBeGreaterThan(0);
  });

  it('makes the night darker than anywhere else', () => {
    expect(inTheMarsh(1 * 60).sim.darkness()).toBeCloseTo(NIGHT_DARK + MIST_DARK);
  });

  it('stops at the pass: Haugar keeps its own sky', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul });
    expect(h.sim.fog()).toEqual({ amount: 0, r: 0 });
  });
});
