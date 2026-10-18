import { describe, expect, it } from 'vitest';
import type { TerrainId } from '@content/terrain';
import type { TerrainDef } from '@core/world/terrain';
import type { TerrainGrid } from '@core/world/textmap';
import { SHADE_CORNER, SHADE_N, SHADE_W, shadeMasks } from '@core/world/shade';

const DEFS = {
  grass: { solid: false },
  wall: { solid: true },
  water: { solid: true, low: true },
  tree: { solid: true, decor: { art: ['decor_tree'], w: 1, h: 1 } },
} as unknown as Readonly<Record<TerrainId, TerrainDef>>;

function grid(rows: readonly string[]): TerrainGrid {
  const map: Record<string, string> = { '.': 'grass', '#': 'wall', '~': 'water', T: 'tree' };
  const cells = rows.flatMap((r) => Array.from(r).map((ch) => map[ch] as TerrainId));
  return { cols: rows[0]?.length ?? 0, rows: rows.length, cells };
}

describe('shade masks', () => {
  it('shades the cell south of a wall and the cell east of one', () => {
    const m = shadeMasks(grid(['#.', '..']), DEFS);
    expect(m[0]).toBe(0);
    expect(m[1]).toBe(SHADE_W);
    expect(m[2]).toBe(SHADE_N);
    expect(m[3]).toBe(SHADE_CORNER);
  });

  it('combines a wall to the north and one to the west', () => {
    const m = shadeMasks(grid(['##', '#.']), DEFS);
    expect(m[3]).toBe(SHADE_N | SHADE_W);
  });

  it('lets water receive shade but never cast it', () => {
    const m = shadeMasks(grid(['#', '~', '.']), DEFS);
    expect(m[1]).toBe(SHADE_N);
    expect(m[2]).toBe(0);
  });

  it('treats decor blocks as casters and the map edge as open', () => {
    const m = shadeMasks(grid(['T', '.']), DEFS);
    expect(m[0]).toBe(0);
    expect(m[1]).toBe(SHADE_N);
  });

  it('is one entry per cell', () => {
    expect(shadeMasks(grid(['...', '...']), DEFS)).toHaveLength(6);
  });
});
