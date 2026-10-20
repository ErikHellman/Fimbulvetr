import { blobCells, type TileSheet } from '../askdalr/build';
import { CRYPT_FLOOR, CRYPT_WALL_INNER, CRYPT_WALL_ISLAND, PIT_INNER, PIT_ISLAND } from './tiles';

/** Konungshaugr's drawn tile sheets; the ghost floor shares the pit's cells. */
export function konungshaugrSheets(): TileSheet[] {
  const pit = blobCells(PIT_ISLAND, PIT_INNER);
  return [
    { terrain: 'crypt_floor', cells: CRYPT_FLOOR },
    { terrain: 'crypt_wall', cells: blobCells(CRYPT_WALL_ISLAND, CRYPT_WALL_INNER) },
    { terrain: 'pit', cells: pit },
    { terrain: 'ghost', cells: pit },
  ];
}
