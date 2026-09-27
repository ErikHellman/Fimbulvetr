import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { DropTable } from '@core/actors/enemies/defs';
import type { ContentDb } from '@core/sim/db';
import { DROP_TICKS } from '@core/sim/systems/pickups';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

/** An open test_a with a mortal 1-hp dummy at (16,13) and a pot at (12,14). */
function arena(drops?: DropTable, immortal = false): ContentDb {
  const things: Thing[] = [
    { k: 'enemy', id: 'dummy', at: { x: 16, y: 13 } },
    { k: 'prop', id: 'pot', at: { x: 12, y: 14 } },
  ];
  const open = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  return {
    ...DB,
    enemies: { ...DB.enemies, dummy: { ...DB.enemies.dummy, hp: 1, immortal, ...(drops && { drops }) } },
    screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map: open, things } },
  };
}

const dummies = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'enemy');
const drops = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'pickup');

function throwPotEast(h: Harness): Harness {
  h.press(['interact']).idle(20);
  h.step(h.frame(['right'])).step({ ...h.frame(['right']), pressed: 1 << 10 });
  return h.idle(40);
}

describe('one damage path', () => {
  it('a thrown pot kills a 1-hp enemy, which is removed with one killed event', () => {
    const h = throwPotEast(new Harness({ db: arena(), tile: [12, 13], facing: 's' }));
    expect(dummies(h)).toHaveLength(0);
    expect(h.count('killed')).toBe(1);
    expect(h.events.find((e) => e.t === 'killed')).toMatchObject({ def: 'dummy', x: 16 * 16 + 8 });
  });

  it('the sword kills through the same path', () => {
    const h = new Harness({ db: arena(), tile: [15, 13], facing: 'e' });
    h.press(['sword']).idle(20);
    expect(dummies(h)).toHaveLength(0);
    expect(h.count('killed')).toBe(1);
  });

  it('an immortal enemy refills instead of dying', () => {
    const h = throwPotEast(new Harness({ db: arena(undefined, true), tile: [12, 13], facing: 's' }));
    expect(dummies(h)).toHaveLength(1);
    expect(dummies(h)[0]?.hp).toBe(1);
    expect(h.count('killed')).toBe(0);
  });
});

describe('drops', () => {
  it('rolls the same drop for the same seed', () => {
    const table = { heart: 1, silver: 1, none: 1 };
    const run = (seed: number) => {
      const h = new Harness({ db: arena(table), tile: [15, 13], facing: 'e', seed });
      h.press(['sword']).idle(5);
      return drops(h).map((d) => d.def);
    };
    for (const seed of [1, 2, 3, 4, 5]) expect(run(seed)).toEqual(run(seed));
    const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => run(s).join());
    expect(new Set(all).size).toBeGreaterThan(1);
  });

  it('silver adds one and a heart heals a heart when walked over', () => {
    const h = new Harness({ db: arena({ heart: 0, silver: 1, none: 0 }), tile: [15, 13], facing: 'e' });
    h.press(['sword']).idle(5);
    expect(drops(h).map((d) => d.def)).toEqual(['silver']);
    const before = h.sim.state.hero.silver;
    h.hold(['right'], 20);
    expect(drops(h)).toHaveLength(0);
    expect(h.sim.state.hero.silver).toBe(before + 1);

    const g = new Harness({ db: arena({ heart: 1, silver: 0, none: 0 }), tile: [15, 13], facing: 'e' });
    g.sim.hero.hp = 4;
    g.press(['sword']).idle(5).hold(['right'], 20);
    expect(g.sim.hero.hp).toBe(8);
  });

  it('runs out if left lying', () => {
    const h = new Harness({ db: arena({ heart: 1, silver: 0, none: 0 }), tile: [15, 13], facing: 'e' });
    h.press(['sword']).hold(['left'], 20);
    expect(drops(h)).toHaveLength(1);
    h.idle(DROP_TICKS);
    expect(drops(h)).toHaveLength(0);
  });
});
