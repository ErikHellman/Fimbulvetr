import { hashInts } from '@core/math/hash';
import { blobIndex, neighbourMask } from '@core/world/autotile';
import type { TerrainGrid } from '@core/world/textmap';
import type { Tileset } from './tileset';

/** 8-neighbour mask of cells whose terrain shares the auto-tile group of the cell at (x, y). */
export function groupMask(grid: TerrainGrid, tileset: Tileset, x: number, y: number): number {
  const terrain = grid.cells[y * grid.cols + x];
  if (terrain === undefined) throw new Error(`no terrain at ${x},${y}`);
  const group = tileset.entries[terrain].group;
  return neighbourMask(x, y, grid.cols, grid.rows, (nx, ny) => {
    const other = grid.cells[ny * grid.cols + nx];
    return other !== undefined && tileset.entries[other].group === group;
  });
}

/** Tileset index for every cell: blob variant for auto-tiled terrain, a stable hashed variant otherwise. */
export function tileIndices(grid: TerrainGrid, tileset: Tileset, salt: number): number[] {
  const out: number[] = [];
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      const terrain = grid.cells[y * grid.cols + x];
      if (terrain === undefined) throw new Error(`no terrain at ${x},${y}`);
      const entry = tileset.entries[terrain];
      if (entry.autotile) {
        out.push(entry.start + blobIndex(groupMask(grid, tileset, x, y)));
      } else {
        out.push(entry.start + (hashInts(x, y, salt) % entry.count));
      }
    }
  }
  return out;
}
