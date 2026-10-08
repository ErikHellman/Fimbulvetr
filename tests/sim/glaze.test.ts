import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { Harness, frameOf } from './harness';

/**
 * test_a with a sheet of glaze over cols 10–30, rows 5–15, ground all round it, and a rock on the ice at
 * (20,10).
 */
function rink(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    const row = ['#', ...Array.from({ length: 38 }, () => '.'), '#'];
    if (y >= 5 && y <= 15) for (let x = 10; x <= 30; x++) row[x] = '◇';
    if (y === 10) row[20] = '#';
    return row.join('');
  });
  const screen = { ...DB.screens.test_a, map, things: [] };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

const feet = (h: Harness): [number, number] => [
  Math.floor(h.sim.hero.pos.x / 16),
  Math.floor((h.sim.hero.pos.y - 1) / 16),
];

describe('glaze', () => {
  it('carries Ask on from the first step until the ice ends, then Ask stands on the ground', () => {
    const h = new Harness({ db: rink(), tile: [8, 7] });
    h.until((s) => s.hero.pos.x >= 10 * 16, 60, frameOf(['right']));
    h.idle(200);
    expect(feet(h)).toEqual([31, 7]);
    const x = h.sim.hero.pos.x;
    h.idle(20);
    expect(h.sim.hero.pos.x).toBe(x);
  });

  it('slides at its own speed, faster than a walk, with no input', () => {
    const h = new Harness({ db: rink(), tile: [12, 7] });
    h.hold(['right'], 1);
    const x = h.sim.hero.pos.x;
    h.idle(10);
    expect(h.sim.hero.pos.x - x).toBeCloseTo(10 * DB.tuning.hero.slide, 5);
  });

  it('stops against a rock on the ice, and Ask stands on the ice there', () => {
    const h = new Harness({ db: rink(), tile: [12, 10] });
    h.hold(['right'], 2);
    h.idle(60);
    expect(feet(h)).toEqual([19, 10]);
    expect(h.sim.hero.vel).toEqual({ x: 0, y: 0 });
  });

  it('cannot be steered mid-slide', () => {
    const h = new Harness({ db: rink(), tile: [12, 7] });
    h.hold(['right'], 2);
    const y = h.sim.hero.pos.y;
    h.hold(['up'], 20);
    expect(h.sim.hero.pos.y).toBe(y);
  });

  it('lines Ask up on the tile it slides along', () => {
    const h = new Harness({ db: rink(), tile: [12, 12] });
    h.sim.hero.pos = { x: h.sim.hero.pos.x + 5, y: h.sim.hero.pos.y };
    h.hold(['up'], 2);
    expect(h.sim.hero.pos.x).toBe(12 * 16 + 8);
  });

  it('only slides on foot: a diagonal push picks the stronger way', () => {
    const h = new Harness({ db: rink(), tile: [12, 12] });
    h.step(frameOf(['up', 'right']));
    h.idle(80);
    // Diagonal input has equal axes: the facing (east, from the stick's x) wins.
    expect(feet(h)[1]).toBe(12);
  });
});
