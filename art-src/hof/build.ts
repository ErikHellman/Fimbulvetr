import type { TileSheet } from '../askdalr/build';
import { ARCH, HOF_FLOOR, HOF_FLOOR_HI } from './tiles';

/** Sökkva Hof's drawn tile sheets. */
export function hofSheets(): TileSheet[] {
  return [
    { terrain: 'hof_floor', cells: HOF_FLOOR },
    { terrain: 'hof_floor_hi', cells: HOF_FLOOR_HI },
    { terrain: 'arch', cells: ARCH },
  ];
}
