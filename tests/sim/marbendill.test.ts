import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { EnemyId } from '@content/ids';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { MARBENDILL } from '@core/actors/enemies/marbendill';
import { length, sub } from '@core/math/vec';
import { Harness, frameOf } from './harness';

function arena(foes: readonly (readonly [EnemyId, number, number])[]): ContentDb {
  const open = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const things: Thing[] = foes.map(([id, x, y]) => ({ k: 'enemy', id, at: { x, y } }));
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map: open, things } } };
}

const foe = (h: Harness) => {
  const e = h.sim.enemies.find((a) => a.def === 'marbendill');
  if (e === undefined) throw new Error('no marbendill');
  return e;
};

describe('the marbendill', () => {
  it('climbs out untouchable, then creeps up and crouches with its hands out before it grabs', () => {
    const h = new Harness({ db: arena([['marbendill', 14, 10]]), tile: [10, 10], facing: 'e' });
    expect(foe(h).fsm.s).toBe('rise');
    h.until(() => foe(h).fsm.s === 'tell', MARBENDILL.riseTicks + 200);
    expect(MARBENDILL.tellTicks).toBeGreaterThanOrEqual(18);
    expect(MARBENDILL.tellTicks).toBeLessThanOrEqual(30);
    h.until(() => foe(h).fsm.s === 'grab', MARBENDILL.tellTicks + 2);
    h.expectAnims();
  });

  it('hauls Ask in when its grab lands, instead of throwing them back', () => {
    const h = new Harness({ db: arena([['marbendill', 13, 10]]), tile: [10, 10], facing: 'e' });
    h.until(() => foe(h).fsm.s === 'tell', 400);
    const hp = h.sim.hero.hp;
    h.until((s) => s.hero.hp < hp, MARBENDILL.tellTicks + MARBENDILL.grabTicks);
    const gap = length(sub(foe(h).pos, h.sim.hero.pos));
    h.idle(6);
    expect(length(sub(foe(h).pos, h.sim.hero.pos))).toBeLessThanOrEqual(gap);
  });

  it('scrambles away with its back open when struck', () => {
    const h = new Harness({ db: arena([['marbendill', 12, 10]]), tile: [10, 10], facing: 'e' });
    h.until(() => foe(h).fsm.s === 'tell', 400);
    h.step(frameOf([], ['sword'])).idle(4);
    expect(foe(h).fsm.s).toBe('flee');
    const before = length(sub(foe(h).pos, h.sim.hero.pos));
    h.idle(20);
    expect(length(sub(foe(h).pos, h.sim.hero.pos))).toBeGreaterThan(before);
  });
});
