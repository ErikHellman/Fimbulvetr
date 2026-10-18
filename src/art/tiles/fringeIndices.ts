import type { FringeSpec } from '@core/world/fringe';
import { blobIndex } from '@core/world/autotile';
import { fringeMasks } from '@core/world/fringe';
import type { TerrainGrid } from '@core/world/textmap';
import type { Tileset } from './tileset';

/** The fringe overlay's tile per cell, or -1 where no ground spills onto it. */
export function fringeIndices(grid: TerrainGrid, tileset: Tileset, spec: FringeSpec): number[] {
  return fringeMasks(grid, spec).map((f) => {
    if (f === null) return -1;
    const entry = tileset.fringe[f.terrain];
    if (entry === undefined) return -1;
    return entry.start + blobIndex(~f.mask & 0xff);
  });
}
