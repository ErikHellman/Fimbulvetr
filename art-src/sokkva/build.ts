import { blobCells, type TileSheet } from '../askdalr/build';
import { BOARDS, MILL_WALL_INNER, MILL_WALL_ISLAND, RACE, RACE_HI, SLUICE, SLUICE_HI } from './tiles';

/** Sökkva Kvern's drawn tile sheets. */
export function sokkvaSheets(): TileSheet[] {
  return [
    { terrain: 'sluice', cells: SLUICE },
    { terrain: 'sluice_hi', cells: SLUICE_HI },
    { terrain: 'race', cells: RACE },
    { terrain: 'race_hi', cells: RACE_HI },
    { terrain: 'boards', cells: BOARDS },
    { terrain: 'mill_wall', cells: blobCells(MILL_WALL_ISLAND, MILL_WALL_INNER) },
  ];
}
