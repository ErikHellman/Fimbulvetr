import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

/** test_a with an east-running belt along row 10 (cols 5–30) and a wall at col 31. */
function hall(things: Thing[] = [], flag = false): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    if (y === 10) return '#' + '.'.repeat(4) + '→'.repeat(26) + '#' + '.'.repeat(7) + '#';
    return '#' + '.'.repeat(38) + '#';
  });
  const screen = {
    ...DB.screens.test_a,
    map,
    things,
    ...(flag ? { belts: { flag: 'w_d6_belts' as const } } : {}),
  };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

describe('a conveyor belt', () => {
  it('carries Ask along it with no input, a pixel a tick', () => {
    const h = new Harness({ db: hall(), tile: [10, 10] });
    const x = h.sim.hero.pos.x;
    h.idle(30);
    expect(h.sim.hero.pos.x).toBeCloseTo(x + 30 * DB.tuning.hero.belt, 5);
  });

  it('stops at a wall', () => {
    const h = new Harness({ db: hall(), tile: [28, 10] });
    h.idle(200);
    expect(h.sim.hero.pos.x).toBeLessThan(31 * 16);
  });

  it('runs the other way while its lever flag is set', () => {
    const h = new Harness({ db: hall([], true), tile: [10, 10] });
    h.sim.state.flags.w_d6_belts = true;
    const x = h.sim.hero.pos.x;
    h.idle(30);
    expect(h.sim.hero.pos.x).toBeLessThan(x - 20);
  });

  it('carries a walking foe too', () => {
    const h = new Harness({ db: hall([{ k: 'enemy', id: 'dummy', at: { x: 12, y: 10 } }]), tile: [4, 4] });
    const foe = h.sim.enemies[0];
    if (foe === undefined) throw new Error('no foe');
    const x = foe.pos.x;
    h.idle(30);
    expect(foe.pos.x).toBeGreaterThan(x + 20);
  });

  it('leaves Ask alone off the belt', () => {
    const h = new Harness({ db: hall(), tile: [10, 12] });
    const x = h.sim.hero.pos.x;
    h.idle(30);
    expect(h.sim.hero.pos.x).toBe(x);
  });
});
