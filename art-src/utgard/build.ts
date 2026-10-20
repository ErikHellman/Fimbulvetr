import type { TileSheet } from '../askdalr/build';
import { GIANT_FLOOR, GIANT_WALL } from './tiles';

/** Útgarðr's drawn tile sheets. */
export function utgardSheets(): TileSheet[] {
  return [
    { terrain: 'giant_floor', cells: GIANT_FLOOR },
    { terrain: 'giant_wall', cells: GIANT_WALL },
  ];
}
