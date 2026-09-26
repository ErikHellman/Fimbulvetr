import { describe, expect, it } from 'vitest';
import { MapError, cellAt, parseTextMap } from '@core/world/textmap';
import { LEGEND } from '@content/world/legend';

const row = (s: string): string => s.padEnd(40, '.');
const map = (rows: string[]): string[] => [
  ...rows.map(row),
  ...Array.from({ length: 22 - rows.length }, () => row('')),
];

describe('parseTextMap', () => {
  it('reads terrain through the legend', () => {
    const g = parseTextMap(map(['#~,T']), LEGEND);
    expect([cellAt(g, 0, 0), cellAt(g, 1, 0), cellAt(g, 2, 0), cellAt(g, 3, 0), cellAt(g, 4, 0)]).toEqual([
      'rock',
      'water',
      'path',
      'tree',
      'grass',
    ]);
    expect(cellAt(g, 40, 0)).toBeUndefined();
  });

  it('names the row and column of an unknown character', () => {
    expect(() => parseTextMap(map(['', '...X']), LEGEND)).toThrow(
      new MapError("row 2, col 4: unknown map character 'X'"),
    );
  });

  it('rejects wrong sizes', () => {
    expect(() => parseTextMap(map([]).slice(1), LEGEND)).toThrow('expected 22 rows');
    expect(() => parseTextMap(['.'.repeat(39), ...map([]).slice(1)], LEGEND)).toThrow(
      'row 1: expected 40 columns',
    );
  });
});
