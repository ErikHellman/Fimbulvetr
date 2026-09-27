import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { Season } from '@core/clock/types';
import type { ContentDb } from '@core/sim/db';
import { coverAt } from '@core/world/cover';
import { Harness } from './harness';

/**
 * test_a opened up: open grass, a row of drifts (`^`) on row 6, and a strip of water on rows 15–16 with a
 * grass bank on row 14.
 */
function winterDb(opts: { indoor?: boolean } = {}): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    if (y === 6) return '#' + '^'.repeat(38) + '#';
    if (y === 15 || y === 16) return '#' + '~'.repeat(38) + '#';
    return '#' + '.'.repeat(38) + '#';
  });
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things: [], ...opts } } };
}

const cover = (h: Harness, x: number, y: number) => coverAt(h.sim.screen.cover, DB.coverOrder, x, y);
const start = (season: Season, tile: readonly [number, number], extra: object = {}): Harness =>
  new Harness({ db: winterDb(), season, tile, ...extra });
const walked = (h: Harness, ticks: number, dir: 'right' | 'down' = 'right'): number => {
  const x = h.sim.hero.pos.x;
  const y = h.sim.hero.pos.y;
  h.hold([dir], ticks);
  return dir === 'right' ? h.sim.hero.pos.x - x : h.sim.hero.pos.y - y;
};

describe('snow', () => {
  it('lies over open ground in winter and slows Ask to 70%', () => {
    const snow = start('winter', [5, 10]);
    expect(cover(snow, 5, 10)).toBe('snow');
    const summer = start('summer', [5, 10]);
    expect(cover(summer, 5, 10)).toBeNull();
    expect(walked(snow, 30)).toBeCloseTo(walked(summer, 30) * 0.7, 1);
  });

  it('is cleared by the sword, and the path stays cleared', () => {
    const h = start('winter', [10, 11], { facing: 'n' });
    h.press(['sword']).idle(20);
    expect(cover(h, 10, 10)).toBeNull();
    expect(h.sim.state.world.cover.test_a?.cleared).toMatch(/^[0-9a-f]+$/);
    h.sim.command({ t: 'warp', screen: 'test_a', x: 100, y: 300 });
    h.idle(2);
    expect(cover(h, 10, 10)).toBeNull();
    expect(cover(h, 20, 10)).toBe('snow');
  });

  it('slows Ask half as much in the winter cloak', () => {
    const cloaked = start('winter', [5, 10]);
    cloaked.sim.state.inv.items.winter_cloak = 1;
    const summer = start('summer', [5, 10]);
    expect(walked(cloaked, 30)).toBeCloseTo(walked(summer, 30) * 0.85, 1);
  });

  it('grows nothing indoors', () => {
    const h = new Harness({ db: winterDb({ indoor: true }), season: 'winter', tile: [5, 10] });
    expect(cover(h, 5, 10)).toBeNull();
    expect(cover(h, 5, 15)).toBeNull();
  });
});

describe('drifts', () => {
  it('slow Ask to half and shrug off the sword', () => {
    const h = start('winter', [10, 7], { facing: 'n' });
    expect(cover(h, 10, 6)).toBe('drift');
    h.press(['sword']).idle(20);
    expect(cover(h, 10, 6)).toBe('drift');
    const through = start('winter', [3, 6]);
    const summer = start('summer', [3, 6]);
    expect(walked(through, 30)).toBeCloseTo(walked(summer, 30) * 0.5, 1);
  });

  it('are plain grass outside winter', () => {
    expect(cover(start('autumn', [10, 7]), 10, 6)).toBeNull();
  });
});

describe('ice', () => {
  it('lets Ask walk out over frozen water in winter only', () => {
    const summer = start('summer', [10, 13]);
    walked(summer, 60, 'down');
    expect(Math.floor((summer.sim.hero.pos.y - 1) / 16)).toBeLessThan(15);
    const winter = start('winter', [10, 13]);
    expect(cover(winter, 10, 15)).toBe('ice');
    walked(winter, 90, 'down');
    expect(Math.floor(winter.sim.hero.pos.y / 16)).toBeGreaterThanOrEqual(17);
  });

  it('cannot be cut', () => {
    const h = start('winter', [10, 14], { facing: 's' });
    h.press(['sword']).idle(20);
    expect(cover(h, 10, 15)).toBe('ice');
  });
});

describe('mud', () => {
  it('stands beside the water on a wet spring day and dries when the sky clears', () => {
    const h = start('spring', [10, 12]);
    expect(cover(h, 10, 14)).toBeNull();
    h.sim.command({ t: 'weather', kind: 'rain' });
    h.idle(2);
    expect(cover(h, 10, 14)).toBe('mud');
    expect(cover(h, 10, 11)).toBeNull();
    h.sim.command({ t: 'weather', kind: 'clear' });
    h.idle(2);
    expect(cover(h, 10, 14)).toBeNull();
  });

  it('slows Ask to 75% and cannot be cut', () => {
    const h = start('spring', [3, 14], { facing: 'e' });
    h.sim.command({ t: 'weather', kind: 'rain' });
    h.idle(2);
    const dry = start('spring', [3, 14]);
    dry.idle(2);
    expect(walked(h, 30)).toBeCloseTo(walked(dry, 30) * 0.75, 1);
    h.press(['sword']).idle(20);
    expect(cover(h, h.sim.hero.pos.x >> 4, 14)).toBe('mud');
  });
});
