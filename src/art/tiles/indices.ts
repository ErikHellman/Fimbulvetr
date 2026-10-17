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

/** Flip flag for ScreenView: bit 1 flips a tile left-right. */
export const FLIP_X = 1;

/**
 * Per-cell flips that break up repetition on the one interior tile of each auto-tiled terrain (a lake, a
 * cliff face): a stable hash mirrors about half the cells left-right. Only the edgeless interior may flip,
 * since the lit rims of edge tiles would change sides, and tiles never flip top-bottom: that would move
 * their light to the wrong side, and Phaser 4 draws a flipY'd tile from an extruded tileset black.
 */
export function tileFlips(grid: TerrainGrid, tileset: Tileset, salt: number): number[] {
  const out: number[] = [];
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      const terrain = grid.cells[y * grid.cols + x];
      if (terrain === undefined) throw new Error(`no terrain at ${x},${y}`);
      const entry = tileset.entries[terrain];
      if (!entry.autotile || groupMask(grid, tileset, x, y) !== 0xff) {
        out.push(0);
        continue;
      }
      const h = hashInts(x, y, salt, 0xf11b);
      out.push(h & FLIP_X);
    }
  }
  return out;
}
