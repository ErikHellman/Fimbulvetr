import type { TerrainId } from '@content/terrain';
import { hashInts } from '../math/hash';
import { neighbourMask } from './autotile';
import type { TilePos } from './screen';
import type { TerrainGrid } from './textmap';

/** How many 60-tick slots pass, on average, between fish jumps on a screen. */
const FISH_SLOTS = 8;

/**
 * Water cells with water on all eight sides and off the screen's outer ring: where a fish can jump without
 * clipping the bank or the edge of the screen. `isWaterGroup` says which terrains count as water (the ford,
 * a jetty).
 */
export function openWaterCells(grid: TerrainGrid, isWaterGroup: (t: TerrainId) => boolean): TilePos[] {
  const out: TilePos[] = [];
  const same = (nx: number, ny: number): boolean => {
    const t = grid.cells[ny * grid.cols + nx];
    return t !== undefined && isWaterGroup(t);
  };
  for (let y = 1; y < grid.rows - 1; y++) {
    for (let x = 1; x < grid.cols - 1; x++) {
      if (grid.cells[y * grid.cols + x] !== 'water') continue;
      if (neighbourMask(x, y, grid.cols, grid.rows, same) === 0xff) out.push({ x, y });
    }
  }
  return out;
}

/**
 * Whether a fish jumps in this slot, and in which of `cells` open-water cells. Stateless, so the same screen
 * and tick always give the same answer.
 */
export function fishJump(salt: number, slot: number, cells: number): number | null {
  if (cells <= 0 || hashInts(salt, slot) % FISH_SLOTS !== 0) return null;
  return hashInts(salt, slot, 1) % cells;
}
