import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

function critterDb(things: Thing[]): ContentDb {
  const open = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map: open, things } } };
}

const PEN: Thing = { k: 'pen', at: { x: 8, y: 3 }, w: 5, h: 3, v: 'ask_pen', flag: 'q_sheep_d1', count: 1 };
const critters = (h: Harness, id: string) => h.sim.actors.filter((a) => a.kind === 'critter' && a.def === id);

describe('sheep', () => {
  it('shy away from the hero, so walking at them herds them into the pen', () => {
    const h = new Harness({
      db: critterDb([PEN, { k: 'critter', id: 'sheep', at: { x: 10, y: 9 }, tag: 0 }]),
      tile: [10, 13],
    });
    h.until((s) => s.state.flags.q_sheep_d1 === true, 600, h.frame(['up']));
    expect(h.sim.state.world.vars['ask_pen']).toBe(1);
  });

  it('stay penned, also after leaving and coming back', () => {
    const h = new Harness({
      db: critterDb([PEN, { k: 'critter', id: 'sheep', at: { x: 10, y: 9 }, tag: 0 }]),
      tile: [10, 13],
    });
    h.until((s) => s.state.flags.q_sheep_d1 === true, 600, h.frame(['up']));
    h.idle(300);
    const sheep = critters(h, 'sheep')[0];
    expect(Math.floor((sheep?.pos.y ?? 0) / 16)).toBeLessThan(6);
    h.sim.command({ t: 'warp', screen: 'test_a', x: 20 * 16, y: 15 * 16 });
    h.idle(2);
    expect(critters(h, 'sheep')[0]?.mem['penned']).toBe(1);
  });

  it('shrug off thrown things', () => {
    const h = new Harness({
      db: critterDb([
        { k: 'prop', id: 'stone', at: { x: 10, y: 14 } },
        { k: 'critter', id: 'sheep', at: { x: 10, y: 5 } },
      ]),
      tile: [10, 15],
      facing: 'n',
    });
    h.press(['interact']).idle(14);
    h.step({ ...h.frame(['up']), pressed: 1 << 10 }).idle(40);
    expect(h.count('hit')).toBe(0);
  });
});

describe('ravens', () => {
  const raven: Thing = {
    k: 'critter',
    id: 'raven',
    at: { x: 10, y: 8 },
    onGone: [{ k: 'add', flag: 'q_ravens', n: 1 }],
  };

  it('ignore the sword but fly off for good when hit by a throw', () => {
    const h = new Harness({
      db: critterDb([
        { ...raven, at: { x: 10, y: 11 } },
        { k: 'prop', id: 'stone', at: { x: 10, y: 14 } },
      ]),
      tile: [10, 15],
      facing: 'n',
    });
    h.press(['interact']).idle(14);
    h.step({ ...h.frame(['up']), pressed: 1 << 10 }).idle(80);
    expect(critters(h, 'raven')).toHaveLength(0);
    expect(h.sim.state.flags.q_ravens).toBe(1);
  });

  it('hop away when the hero comes close', () => {
    const h = new Harness({ db: critterDb([raven]), tile: [10, 12] });
    h.hold(['up'], 40);
    expect(h.count('sfx')).toBeGreaterThan(0);
    expect(critters(h, 'raven')[0]?.pos.y).toBeLessThan(8 * 16 + 14);
  });
});
