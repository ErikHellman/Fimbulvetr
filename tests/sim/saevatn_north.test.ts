import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { Season } from '@core/clock/types';
import { Harness, frameOf } from './harness';
import { crossTo, heroTile, walkTo } from './walk';

function onTheStrand(season: Season, skin: boolean): Harness {
  const h = new Harness({ preset: DEV_PRESETS.fimbul, screen: 'nif_shore', tile: [6, 10], season });
  Object.assign(h.sim.state.flags, { st_rime_open: true, st_niflmyrr_reached: true });
  if (skin) h.sim.state.inv.items.sealskin = 1;
  return h;
}

describe('the north of Sævatn', () => {
  it('is swum from Niflmýrr’s strand down past the seal rocks to Holmr and the Refuge’s door', () => {
    const h = onTheStrand('summer', true);
    walkTo(h, 0, 10);
    crossTo(h, 'w', 'sae_fjordmouth');
    walkTo(h, 20, 21);
    crossTo(h, 's', 'sae_seal_rocks');
    walkTo(h, 20, 21);
    crossTo(h, 's', 'sae_north');
    walkTo(h, 0, 10);
    crossTo(h, 'w', 'sae_well');
    walkTo(h, 20, 21);
    crossTo(h, 's', 'sae_holmr');
    walkTo(h, 18, 12);
    h.hold(['up'], 60).idle(40);
    expect(h.sim.screen.id).toBe('ref_int_hall');
  });

  it('is walked over the ice in winter as far as Holmr’s warm water, but not from the strand', () => {
    const strand = onTheStrand('winter', false);
    walkTo(strand, 0, 10);
    crossTo(strand, 'w', 'sae_fjordmouth');
    expect(() => walkTo(strand, 20, 10, 600)).toThrow();
    const h = new Harness({
      preset: DEV_PRESETS.fimbul,
      screen: 'sae_fjordmouth',
      tile: [20, 10],
      season: 'winter',
    });
    walkTo(h, 20, 21);
    crossTo(h, 's', 'sae_seal_rocks');
    walkTo(h, 20, 21);
    crossTo(h, 's', 'sae_north');
    walkTo(h, 0, 10);
    crossTo(h, 'w', 'sae_well');
    walkTo(h, 20, 21);
    crossTo(h, 's', 'sae_holmr');
    walkTo(h, 20, 2);
    expect(() => walkTo(h, 18, 12, 600)).toThrow();
  });

  it('has a surge in the narrows that only a diver gets through, with a chest on the bottom under it', () => {
    const h = new Harness({
      preset: DEV_PRESETS.fimbul,
      screen: 'sae_narrows',
      tile: [15, 10],
      season: 'summer',
    });
    h.sim.state.inv.items.sealskin = 1;
    h.hold(['up'], 120);
    expect(heroTile(h.sim)[1]).toBeGreaterThanOrEqual(6);
    // Under the surge the chest is taken on the way down to it…
    walkTo(h, 15, 8);
    h.step(frameOf(['up'], ['roll']));
    h.until((s) => s.mode === 'story', 120, frameOf(['up']));
    for (let i = 0; i < 400 && h.sim.mode !== 'play'; i += 4) h.step(frameOf([], ['confirm'])).idle(3);
    expect(h.sim.state.world.opened).toContain('sae_c_narrows');
    // …and a second dive gets through.
    h.idle(60);
    walkTo(h, 15, 8);
    h.step(frameOf(['up'], ['roll']));
    h.until((s) => heroTile(s)[1] <= 5, 120, frameOf(['up']));
    walkTo(h, 15, 0);
    crossTo(h, 'n', 'sae_north');
  });
});
