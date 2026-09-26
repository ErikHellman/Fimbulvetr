import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { TUNING } from '@content/tuning';
import type { ContentDb } from '@core/sim/db';
import { Harness } from './harness';

/** test_a opened up, with a row of south ledges ('#') on row 12 and slow path (',') on row 16. */
function ledgeDb(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => (y === 12 ? '#' : y === 16 ? ',' : '.').repeat(40));
  return {
    ...DB,
    terrain: { ...DB.terrain, rock: { solid: false, ledge: 's' }, path: { solid: false, slow: 0.5 } },
    screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things: [] } },
  };
}

describe('ledges', () => {
  it('are hopped down after pushing into them briefly', () => {
    const h = new Harness({ db: ledgeDb(), tile: [10, 10], facing: 's' });
    h.until((s) => s.hero.fsm.s === 'hop', 120, h.frame(['down']));
    let peak = 0;
    h.until((s) => {
      peak = Math.max(peak, s.hero.mem['z'] ?? 0);
      return s.hero.fsm.s === 'move';
    }, TUNING.hero.hopTicks + 2);
    expect(peak).toBeGreaterThan(TUNING.hero.hopHeight * 0.9);
    expect(Math.floor((h.sim.hero.pos.y - 1) / 16)).toBe(13);
  });

  it('block the way back up', () => {
    const h = new Harness({ db: ledgeDb(), tile: [10, 14], facing: 'n' });
    h.hold(['up'], 60);
    expect(Math.floor((h.sim.hero.pos.y - 1) / 16)).toBe(13);
    expect(h.sim.hero.fsm.s).toBe('move');
  });
});

describe('slow ground', () => {
  it('slows the walk', () => {
    const fast = new Harness({ db: ledgeDb(), tile: [5, 18] });
    const slow = new Harness({ db: ledgeDb(), tile: [5, 16] });
    fast.hold(['right'], 30);
    slow.hold(['right'], 30);
    const d = (h: Harness): number => h.sim.hero.pos.x - (5 * 16 + 8);
    expect(d(slow)).toBeCloseTo(d(fast) / 2);
  });
});
