import type { CoverId } from '@content/ids';
import type { CoverGrid } from '@core/world/cover';
import type { Tileset } from './tileset';

/** Tileset index per cell of a cover grid: standing or cut tile, or -1 where there is no cover. */
export function coverIndices(grid: CoverGrid, order: readonly CoverId[], tileset: Tileset): number[] {
  const out: number[] = [];
  for (let i = 0; i < grid.cols * grid.rows; i++) {
    const id = order[(grid.kind[i] ?? 0) - 1];
    if (id === undefined) out.push(-1);
    else out.push(grid.cleared[i] === 1 ? tileset.cover[id].cut : tileset.cover[id].standing);
  }
  return out;
}
