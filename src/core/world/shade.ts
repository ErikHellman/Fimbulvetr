import type { TerrainId } from '@content/terrain';
import type { TerrainDef } from './terrain';
import type { TerrainGrid } from './textmap';

/** The light stands high to the north-west, so anything with height shades the ground south and east of it. */
export const SHADE_N = 1;
export const SHADE_W = 2;
/** Only the north-west diagonal is raised: a small corner of shade. */
export const SHADE_CORNER = 4;

/** Raised things cast shade: solid terrain that is not open above (water and sap lie flat). */
const casts = (def: TerrainDef | undefined): boolean => def !== undefined && def.solid && def.low !== true;
/** Flat ground takes shade: anything walkable, and water. */
const receives = (def: TerrainDef | undefined): boolean =>
  def !== undefined && (!def.solid || def.low === true);

/**
 * One shade mask per cell: which raised neighbours (north, west, or only the north-west corner) throw
 * shade onto it. Cells that are raised themselves get 0; the map edge counts as open ground.
 */
export function shadeMasks(grid: TerrainGrid, defs: Readonly<Record<TerrainId, TerrainDef>>): number[] {
  const at = (x: number, y: number): TerrainDef | undefined => {
    if (x < 0 || y < 0 || x >= grid.cols || y >= grid.rows) return undefined;
    const t = grid.cells[y * grid.cols + x];
    return t === undefined ? undefined : defs[t];
  };
  const out: number[] = [];
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      if (!receives(at(x, y))) {
        out.push(0);
        continue;
      }
      const n = casts(at(x, y - 1));
      const w = casts(at(x - 1, y));
      let mask = (n ? SHADE_N : 0) | (w ? SHADE_W : 0);
      if (mask === 0 && casts(at(x - 1, y - 1))) mask = SHADE_CORNER;
      out.push(mask);
    }
  }
  return out;
}
