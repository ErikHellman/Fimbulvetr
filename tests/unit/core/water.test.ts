import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { parseTextMap } from '@core/world/textmap';
import { levelPassage, riseFooting } from '@core/world/water';

describe('water levels', () => {
  it('flood a sluice floor once the water reaches it, and float race planks once it lifts them', () => {
    expect([0, 1, 2].map((l) => riseFooting({ floods: 1 }, l))).toEqual([true, false, false]);
    expect([0, 1, 2].map((l) => riseFooting({ floods: 2 }, l))).toEqual([true, true, false]);
    expect([0, 1, 2].map((l) => riseFooting({ floats: 1 }, l))).toEqual([false, true, true]);
    expect([0, 1, 2].map((l) => riseFooting({ floats: 2 }, l))).toEqual([false, false, true]);
  });

  it('list the footing of every rising tile of a screen at a level, and nothing else', () => {
    const map = Array.from({ length: 22 }, (_, y) => (y === 5 ? '1234' + '.'.repeat(36) : '.'.repeat(40)));
    const grid = parseTextMap(map, DB.legend);
    const at = (level: number) => [...levelPassage(grid, DB.terrain, level).entries()];
    expect(at(0)).toEqual([
      [200, true],
      [201, true],
      [202, false],
      [203, false],
    ]);
    expect(at(1)).toEqual([
      [200, false],
      [201, true],
      [202, true],
      [203, false],
    ]);
    expect(at(2)).toEqual([
      [200, false],
      [201, false],
      [202, true],
      [203, true],
    ]);
  });
});
