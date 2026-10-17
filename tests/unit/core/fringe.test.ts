import { describe, expect, it } from 'vitest';
import type { TerrainId } from '@content/terrain';
import type { TerrainGrid } from '@core/world/textmap';
import { N, NE, NW, S, SE, SW, W } from '@core/world/autotile';
import { fringeMasks, type FringeSpec } from '@core/world/fringe';

const SPEC: FringeSpec = {
  spill: { grass: 3, heath: 3, sand: 1 },
  receive: ['field', 'flagstone'] as TerrainId[],
};

function grid(rows: readonly string[]): TerrainGrid {
  const map: Record<string, string> = {
    g: 'grass',
    h: 'heath',
    s: 'sand',
    f: 'field',
    p: 'flagstone',
    '#': 'wall',
  };
  const cells = rows.flatMap((r) => Array.from(r).map((ch) => map[ch] as TerrainId));
  return { cols: rows[0]?.length ?? 0, rows: rows.length, cells };
}

describe('fringe masks', () => {
  it('lets higher ground spill onto lower ground, with the mask of the spilling cells', () => {
    const m = fringeMasks(grid(['gg', 'sf']), SPEC);
    expect(m[0]).toBeNull();
    expect(m[2]).toEqual({ terrain: 'grass', mask: N | NE });
    expect(m[3]).toEqual({ terrain: 'grass', mask: N | NW });
  });

  it('never fringes equals, walls, or the map edge', () => {
    const m = fringeMasks(grid(['gh', 'g#']), SPEC);
    expect(m.every((x) => x === null)).toBe(true);
  });

  it('picks the highest priority neighbour when two kinds of ground touch a cell', () => {
    const m = fringeMasks(grid(['hps', 'ggg']), SPEC);
    expect(m[1]).toEqual({ terrain: 'grass', mask: S | SW | SE });
  });

  it('lets a receiver take fringe from any spiller, and a spiller only from higher ones', () => {
    const m = fringeMasks(grid(['sp']), SPEC);
    expect(m[1]).toEqual({ terrain: 'sand', mask: W });
    expect(m[0]).toBeNull();
  });
});
