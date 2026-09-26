import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { TUNING } from '@content/tuning';
import type { ContentDb } from '@core/sim/db';
import { coverAt } from '@core/world/cover';
import { Harness } from './harness';

/** test_a opened up, with tall grass on rows 8–12. */
function grassDb(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + (y >= 8 && y <= 12 ? '"' : '.').repeat(38) + '#',
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things: [] } } };
}

const standing = (h: Harness, x: number, y: number): boolean =>
  coverAt(h.sim.screen.cover, DB.coverOrder, x, y) !== null;

describe('tall grass', () => {
  it('slows the hero wading through it', () => {
    const wade = new Harness({ db: grassDb(), tile: [5, 10] });
    const open = new Harness({ db: grassDb(), tile: [5, 15] });
    wade.hold(['right'], 30);
    open.hold(['right'], 30);
    const moved = (h: Harness): number => h.sim.hero.pos.x - (5 * 16 + 8);
    expect(moved(wade)).toBeCloseTo(moved(open) * DB.cover.tall_grass.slow);
    expect(moved(open)).toBeCloseTo(30 * TUNING.hero.walkSpeed);
  });

  it('is cut by the sword, and the cut is saved', () => {
    const h = new Harness({ db: grassDb(), tile: [10, 13], facing: 'n' });
    expect(standing(h, 10, 12)).toBe(true);
    h.press(['sword']).idle(20);
    expect(standing(h, 10, 12)).toBe(false);
    expect(h.count('coverChanged')).toBe(1);
    expect(h.sim.state.world.cover.test_a?.cleared).toMatch(/^[0-9a-f]+$/);
    h.sim.command({ t: 'warp', screen: 'test_a', x: 100, y: 300 });
    h.idle(2);
    expect(standing(h, 10, 12)).toBe(false);
  });

  it('regrows when the season turns, and is gone outside summer', () => {
    const h = new Harness({ db: grassDb(), tile: [10, 13], facing: 'n' });
    h.press(['sword']).idle(20);
    h.sim.command({ t: 'setSeason', season: 'autumn' });
    h.idle(2);
    expect(standing(h, 10, 11)).toBe(false);
    h.sim.command({ t: 'setSeason', season: 'summer' });
    h.idle(2);
    expect(standing(h, 10, 12)).toBe(true);
  });
});
