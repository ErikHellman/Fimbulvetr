import { hashInts } from '@core/math/hash';
import { blobIndex, neighbourMask } from '@core/world/autotile';
import type { TerrainGrid } from '@core/world/textmap';
import type { Tileset } from './tileset';

/** Tileset index for every cell: blob variant for auto-tiled terrain, a stable hashed variant otherwise. */
export function tileIndices(grid: TerrainGrid, tileset: Tileset, salt: number): number[] {
  const out: number[] = [];
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      const terrain = grid.cells[y * grid.cols + x];
      if (terrain === undefined) throw new Error(`no terrain at ${x},${y}`);
      const entry = tileset.entries[terrain];
      if (entry.autotile) {
        const mask = neighbourMask(
          x,
          y,
          grid.cols,
          grid.rows,
          (nx, ny) => grid.cells[ny * grid.cols + nx] === terrain,
        );
        out.push(entry.start + blobIndex(mask));
      } else {
        out.push(entry.start + (hashInts(x, y, salt) % entry.count));
      }
    }
  }
  return out;
}
