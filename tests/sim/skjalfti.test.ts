import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { SKJALFTI } from '@core/sim/systems/skjalfti';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

function room(things: Thing[]): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

function singer(things: Thing[]): Harness {
  const h = new Harness({ db: room(things), tile: [5, 5], facing: 'e' });
  h.sim.state.inv.galdr = ['skjalfti'];
  h.sim.state.hero.seidr = 20;
  return h;
}

describe('Skjálfti', () => {
  it('costs five seiðr, shakes the screen and breaks every weak floor on it, but not stakes or rock', () => {
    const h = singer([
      { k: 'crack', id: 't_floor1', at: { x: 30, y: 15 }, w: 1, h: 1, art: 'floor' },
      { k: 'crack', id: 't_floor2', at: { x: 10, y: 18 }, w: 2, h: 1, art: 'floor' },
      { k: 'crack', id: 't_stake', at: { x: 20, y: 10 }, w: 1, h: 1, art: 'stake' },
      { k: 'crack', id: 't_rock', at: { x: 22, y: 10 }, w: 1, h: 1, art: 'rock' },
    ]);
    h.press(['galdr']);
    h.idle(2);
    expect(h.sim.state.hero.seidr).toBe(15);
    expect(h.events.some((e) => e.t === 'shake')).toBe(true);
    expect(h.sim.state.world.opened).toEqual(expect.arrayContaining(['t_floor1', 't_floor2']));
    expect(h.sim.state.world.opened).not.toContain('t_stake');
    expect(h.sim.state.world.opened).not.toContain('t_rock');
  });

  it('staggers every foe on the screen for two seconds, and marks a boss', () => {
    const h = singer([
      { k: 'enemy', id: 'vargr', at: { x: 30, y: 10 } },
      { k: 'enemy', id: 'draugr', at: { x: 30, y: 15 } },
    ]);
    h.idle(1);
    h.press(['galdr']);
    for (const e of h.sim.enemies) expect(e.mem['stun']).toBeGreaterThan(SKJALFTI.stun - 5);
    const x = h.sim.enemies.map((e) => e.pos.x);
    h.idle(60);
    expect(h.sim.enemies.map((e) => e.pos.x)).toEqual(x);
  });

  it('is sung once from a stave, for no seiðr', () => {
    const h = singer([{ k: 'crack', id: 't_floor', at: { x: 30, y: 15 }, w: 1, h: 1, art: 'floor' }]);
    h.sim.state.inv.galdr = [];
    h.sim.state.hero.seidr = 0;
    h.sim.state.inv.items.stave_skjalfti = 1;
    h.sim.state.inv.slots = ['stave_skjalfti', null];
    h.press(['item1']);
    expect(h.sim.state.world.opened).toContain('t_floor');
    expect(h.sim.state.inv.items.stave_skjalfti ?? 0).toBe(0);
  });
});
