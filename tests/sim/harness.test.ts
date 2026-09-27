import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { Harness } from './harness';

describe('harness presets', () => {
  it('starts a new game from a dev preset, as ?preset= does', () => {
    const h = new Harness({ preset: DEV_PRESETS.night3 });
    expect(h.sim.screen.id).toBe('ask_int_longhouse');
    expect(h.sim.state.inv.weapon).toBe('handaxe');
    expect(h.sim.state.flags.ev_embla_d3).toBe(true);
    expect(h.sim.state.clock.minute).toBe(21 * 60);
  });

  it('checks that every entity shows a drawn animation', () => {
    const h = new Harness({ preset: DEV_PRESETS.day2 });
    h.idle(30).expectAnims();
    h.sim.hero.anim = 'no_such_anim';
    expect(() => h.expectAnims()).toThrow(/no 'no_such_anim' animation/);
  });
});
