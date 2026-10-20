import { blobCells, type TileSheet } from '../askdalr/build';
import { CAVE_FLOOR, CAVE_WALL_INNER, CAVE_WALL_ISLAND, SCREE } from './tiles';

/** Dvergagröf's drawn tile sheets, and the cave set every cave and mine shares. */
export function dvergagrofSheets(): TileSheet[] {
  return [
    { terrain: 'scree', cells: SCREE },
    { terrain: 'cave_floor', cells: CAVE_FLOOR },
    { terrain: 'cave_wall', cells: blobCells(CAVE_WALL_ISLAND, CAVE_WALL_INNER) },
  ];
}
