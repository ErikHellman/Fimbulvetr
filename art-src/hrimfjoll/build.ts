import { blobCells, type TileSheet } from '../askdalr/build';
import { CLEAR_ICE, FIRN, GLAZE, RIME_INNER, RIME_ISLAND, TOWER_FLOOR, TOWER_WALL } from './tiles';

/** Hrímfjöll's and Hrímturn's drawn tile sheets. */
export function hrimfjollSheets(): TileSheet[] {
  return [
    { terrain: 'firn', cells: FIRN },
    { terrain: 'glaze', cells: GLAZE },
    { terrain: 'rime', cells: blobCells(RIME_ISLAND, RIME_INNER) },
    { terrain: 'tower_floor', cells: TOWER_FLOOR },
    { terrain: 'tower_wall', cells: TOWER_WALL },
    { terrain: 'clear_ice', cells: CLEAR_ICE },
  ];
}
