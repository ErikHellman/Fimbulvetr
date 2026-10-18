import type { TerrainId } from '@content/terrain';
import { E, N, NE, NW, S, SE, SW, W } from './autotile';
import type { TerrainGrid } from './textmap';

/**
 * Which ground spills over which (docs/art-style-guide.md, rule 4): terrains with a `spill` priority
 * overlap any neighbouring ground of lower priority by a few pixels; `receive` lists ground that only
 * ever takes a fringe (priority 0). Anything else neither spills nor receives.
 */
export interface FringeSpec {
  readonly spill: Readonly<Partial<Record<TerrainId, number>>>;
  readonly receive: readonly TerrainId[];
}

/** The ground spilling onto a cell and the 8-neighbour mask of the cells it spills from. */
export interface Fringe {
  readonly terrain: TerrainId;
  readonly mask: number;
}

const BITS: readonly (readonly [number, number, number])[] = [
  [0, -1, N],
  [1, -1, NE],
  [1, 0, E],
  [1, 1, SE],
  [0, 1, S],
  [-1, 1, SW],
  [-1, 0, W],
  [-1, -1, NW],
];

/** One fringe per cell, or null where nothing spills onto it. The map edge spills nothing. */
export function fringeMasks(grid: TerrainGrid, spec: FringeSpec): (Fringe | null)[] {
  const priority = (t: TerrainId | undefined): number | undefined => {
    if (t === undefined) return undefined;
    const p = spec.spill[t];
    if (p !== undefined) return p;
    return spec.receive.includes(t) ? 0 : undefined;
  };
  const at = (x: number, y: number): TerrainId | undefined =>
    x < 0 || y < 0 || x >= grid.cols || y >= grid.rows ? undefined : grid.cells[y * grid.cols + x];
  const out: (Fringe | null)[] = [];
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      const own = priority(at(x, y));
      if (own === undefined) {
        out.push(null);
        continue;
      }
      let best: TerrainId | null = null;
      let bestPriority = own;
      for (const [dx, dy] of BITS) {
        const t = at(x + dx, y + dy);
        const p = t === undefined ? undefined : spec.spill[t];
        if (t === undefined || p === undefined || p <= own) continue;
        if (best === null || p > bestPriority || (p === bestPriority && t < best)) {
          best = t;
          bestPriority = p;
        }
      }
      if (best === null) {
        out.push(null);
        continue;
      }
      let mask = 0;
      for (const [dx, dy, bit] of BITS) if (at(x + dx, y + dy) === best) mask |= bit;
      out.push({ terrain: best, mask });
    }
  }
  return out;
}
