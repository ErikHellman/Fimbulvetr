import { describe, expect, it } from 'vitest';
import { TERRAIN } from '@content/terrain';
import { LEGEND } from '@content/world/legend';
import { decorArt, decorFeet, decorPlacements } from '@core/world/decor';
import { MapError, parseTextMap } from '@core/world/textmap';

const row = (s: string): string => s.padEnd(40, '.');
const map = (rows: string[]): string[] => [
  ...rows.map(row),
  ...Array.from({ length: 22 - rows.length }, () => row('')),
];
const place = (rows: string[]): ReturnType<typeof decorPlacements> =>
  decorPlacements(parseTextMap(map(rows), LEGEND), TERRAIN);

describe('decorPlacements', () => {
  it('claims a 2×2 well at its top-left cell', () => {
    expect(place(['.OO', '.OO'])).toEqual([{ terrain: 'well', x: 1, y: 0, w: 2, h: 2 }]);
  });

  it('splits a run of tables into 2×1 blocks in row-major order', () => {
    expect(place(['tttttttttt']).map((p) => [p.terrain, p.x, p.y, p.w, p.h])).toEqual([
      ['table', 0, 0, 2, 1],
      ['table', 2, 0, 2, 1],
      ['table', 4, 0, 2, 1],
      ['table', 6, 0, 2, 1],
      ['table', 8, 0, 2, 1],
    ]);
  });

  it('lists trees row by row', () => {
    expect(place(['TTTT', 'T']).map((p) => [p.x, p.y])).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [0, 1],
    ]);
    expect(place(['T'])[0]).toMatchObject({ terrain: 'tree', w: 1, h: 1 });
  });

  it('accepts a 3×1 trough and rejects a partial one', () => {
    expect(place(['UUU'])).toEqual([{ terrain: 'trough', x: 0, y: 0, w: 3, h: 1 }]);
    expect(() => place(['UUUU'])).toThrow(MapError);
    expect(() => place(['UUUU'])).toThrow('decor trough at 3,0 is incomplete: 4,0 is grass');
  });

  it('grows beds downward from the anchor', () => {
    expect(place(['b', 'b'])).toEqual([{ terrain: 'bed', x: 0, y: 0, w: 1, h: 2 }]);
    expect(() => place(['bb'])).toThrow('incomplete');
  });

  it('rejects overlapping blocks', () => {
    expect(() => place(['..hh', '.hhh', '.hh.'])).toThrow(
      'decor hearth at 1,1 overlaps another block at 2,1',
    );
  });

  it('rejects a block that runs off the map', () => {
    const edge = '.'.repeat(39) + 'O';
    expect(() => place([edge, edge])).toThrow('decor well at 39,0 runs off the map');
  });

  it('ignores terrain without decor', () => {
    expect(place(['~~#,', 'RRWD'])).toEqual([]);
  });
});

describe('decorFeet', () => {
  it('is the bottom centre of the block, 2 px above its last row', () => {
    expect(decorFeet({ terrain: 'well', x: 14, y: 12, w: 2, h: 2 })).toEqual({ x: 240, y: 222 });
    expect(decorFeet({ terrain: 'tree', x: 3, y: 5, w: 1, h: 1 })).toEqual({ x: 56, y: 94 });
  });
});

describe('decorArt', () => {
  it('picks a stable art key from the definition for each cell', () => {
    const def = TERRAIN.tree.decor;
    const seen = new Set<string>();
    for (let x = 0; x < 40; x++) {
      const p = { terrain: 'tree' as const, x, y: 0, w: 1, h: 1 };
      const art = decorArt(p, def, 7);
      expect(def.art).toContain(art);
      expect(decorArt(p, def, 7)).toBe(art);
      seen.add(art);
    }
    expect(seen.size).toBe(def.art.length);
  });
});
