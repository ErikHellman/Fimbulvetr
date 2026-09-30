import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { Season } from '@core/clock/types';
import type { ContentDb } from '@core/sim/db';
import { coverAt } from '@core/world/cover';
import { Harness } from './harness';

/**
 * test_a opened up: open grass, a river across rows 10–13 of rapids (cols 1–15), a shoal ford (cols 16–19)
 * and warm spring water (cols 20–38).
 */
function riverDb(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    if (y >= 10 && y <= 13) return '#' + 'v'.repeat(15) + 'eeee' + 's'.repeat(19) + '#';
    return '#' + '.'.repeat(38) + '#';
  });
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things: [] } } };
}

const cover = (h: Harness, x: number, y: number) => coverAt(h.sim.screen.cover, DB.coverOrder, x, y);
const start = (season: Season, tile: readonly [number, number]): Harness =>
  new Harness({ db: riverDb(), season, tile });
/** Tile row of Ask's feet. */
const row = (h: Harness): number => Math.floor((h.sim.hero.pos.y - 1) / 16);

describe('the spring flood', () => {
  it('lets Ask wade the shoal in summer, slowly', () => {
    const h = start('summer', [17, 8]);
    h.hold(['down'], 150);
    expect(row(h)).toBeGreaterThan(13);
  });

  it('covers the shoal in spring and stops Ask at the bank', () => {
    const h = start('spring', [17, 8]);
    expect(cover(h, 17, 11)).toBe('flood');
    h.hold(['down'], 150);
    expect(row(h)).toBeLessThan(10);
  });

  it('never rises round Ask: the ford they stand in at the turn of the season stays dry till they come back', () => {
    const h = start('winter', [17, 11]);
    h.sim.state.clock.season = 'spring';
    h.sim.state.clock.epoch += 1;
    h.idle(2);
    expect(cover(h, 17, 11)).toBeNull();
    expect(cover(h, 19, 12)).toBeNull();
    h.hold(['down'], 90);
    expect(row(h)).toBeGreaterThan(13);
    h.sim.command({ t: 'warp', screen: 'test_a', x: 17 * 16 + 8, y: 16 * 16 });
    h.idle(2);
    expect(cover(h, 19, 12)).toBe('flood');
  });

  it('stays dry round Ask when they arrive standing in it', () => {
    const h = start('spring', [17, 11]);
    expect(cover(h, 18, 12)).toBeNull();
  });

  it('never freezes the rapids or the warm springs, though still water ices over', () => {
    const h = start('winter', [5, 8]);
    expect(cover(h, 5, 11)).toBeNull();
    expect(cover(h, 25, 11)).toBeNull();
    h.hold(['down'], 120);
    expect(row(h)).toBeLessThan(10);
  });
});
