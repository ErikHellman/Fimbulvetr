import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { BRAGD } from '@core/sim/systems/bragd';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

/** An open test_a (walls only round the edge) with the given things. */
function field(things: Thing[] = []): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

function singer(db: ContentDb): Harness {
  const h = new Harness({ db, tile: [5, 10], facing: 'e' });
  h.sim.state.inv.galdr = ['bragd'];
  return h;
}

const beams = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'projectile' && a.def === 'bragd');
const spin = DB.tuning.sword.spinDamage;

describe('Bragð', () => {
  it('costs four seiðr: Ask sings, and a beam leaves the blade', () => {
    const h = singer(field());
    h.press(['galdr']);
    expect(h.sim.state.hero.seidr).toBe(6);
    expect(h.sim.hero.fsm.s).toBe('cast');
    expect(beams(h)).toHaveLength(1);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_bragd' });
    h.idle(4).expectAnims();
  });

  it('fizzles without enough seiðr', () => {
    const h = singer(field());
    h.sim.state.hero.seidr = 3;
    h.press(['galdr']);
    expect(beams(h)).toHaveLength(0);
    expect(h.sim.state.hero.seidr).toBe(3);
  });

  it('pierces a barrow-wight’s shield from the front with the spin’s damage, and is spent', () => {
    const h = singer(field([{ k: 'enemy', id: 'haugbui', at: { x: 12, y: 10 } }]));
    const wight = h.sim.enemies[0];
    if (wight === undefined) throw new Error('no wight');
    // Out of its mound first: a wight rising cannot be touched.
    h.until((s) => s.enemies[0]?.fsm.s !== 'rise', 60);
    h.sim.hero.pos = { x: wight.pos.x - 64, y: wight.pos.y };
    wight.facing = 'w';
    h.press(['galdr']);
    h.until((s) => s.actors.every((a) => a.def !== 'bragd'), 60);
    expect(wight.hp).toBe(8 - spin);
  });

  it('flies fourteen tiles at most, and stops at a wall', () => {
    const h = singer(field([{ k: 'enemy', id: 'dummy', at: { x: 22, y: 10 } }]));
    h.press(['galdr']);
    h.until((s) => s.actors.every((a) => a.def !== 'bragd'), 200);
    expect(h.sim.tick).toBeLessThanOrEqual(BRAGD.range / BRAGD.speed + 4);
    expect(h.events.some((e) => e.t === 'hit')).toBe(false);

    const w = singer(field());
    w.sim.hero.facing = 'w';
    w.press(['galdr']);
    w.idle(20);
    expect(w.sim.tick).toBeLessThan(BRAGD.range / BRAGD.speed);
    expect(beams(w)).toHaveLength(0);
  });
});
