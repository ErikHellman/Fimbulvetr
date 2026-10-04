import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ContentDb } from '@core/sim/db';
import { HLIF } from '@core/sim/systems/galdr';
import type { Thing } from '@core/world/screen';
import { tileFeet } from '@core/world/screen';
import { Harness } from './harness';
import { talkTo } from './walk';

function field(things: Thing[] = []): ContentDb {
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, things } } };
}

function singer(things: Thing[] = []): Harness {
  const h = new Harness({ db: field(things), tile: [10, 10], facing: 'e' });
  h.sim.state.inv.galdr = ['hlif'];
  return h;
}

describe('Hlíf', () => {
  it('costs three seiðr and wards Ask for three hits', () => {
    const h = singer();
    h.press(['galdr']);
    expect(h.sim.state.hero.seidr).toBe(7);
    expect(h.sim.ward()).toEqual({ hits: HLIF.hits, ticks: HLIF.ticks - 1 });
    expect(h.sim.hero.fsm.s).toBe('cast');
  });

  it('takes any blow, heavy ones too, one rune each, and then Ask is open again', () => {
    const h = singer([{ k: 'enemy', id: 'draugr', at: { x: 11, y: 10 } }]);
    h.press(['galdr']);
    const hp = h.sim.state.hero.hp;
    h.until((s) => s.ward().hits === 0, 1500);
    expect(h.sim.state.hero.hp).toBe(hp);
    expect(h.events.filter((e) => e.t === 'sfx' && e.id === 'sfx_ward').length).toBe(4);
    h.until((s) => s.state.hero.hp < hp, 600);
    expect(h.sim.state.hero.hp).toBeLessThan(hp);
  });

  it('fades after twenty seconds', () => {
    const h = singer();
    h.press(['galdr']);
    h.idle(HLIF.ticks);
    expect(h.sim.ward()).toEqual({ hits: 0, ticks: 0 });
  });

  it('is taught by Sölvi once the pass is open, for silver', () => {
    const h = new Harness({ preset: DEV_PRESETS.haubow });
    Object.assign(h.sim.state.flags, { n_solvi_met: true, st_pass_open: true });
    h.sim.state.hero.silver = 150;
    const p = tileFeet({ x: 19, y: 14 });
    h.sim.command({ t: 'warp', screen: 'upp_int_runehall', x: p.x, y: p.y });
    h.idle(2);
    talkTo(h, 'solvi');
    expect(h.sim.state.inv.galdr).toContain('hlif');
    expect(h.sim.state.hero.silver).toBe(30);
  });
});
