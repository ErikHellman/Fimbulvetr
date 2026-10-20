import { blobCells, type TileSheet } from '../askdalr/build';
import { ROOTS_INNER, ROOTS_ISLAND, SAP_INNERS, SAP_ISLANDS } from './tiles';

/** Rótarhellir's drawn tile sheets: the sap (frame-major) and the roots. */
export function rotarhellirSheets(): TileSheet[] {
  return [
    { terrain: 'sap', cells: SAP_ISLANDS.flatMap((island, f) => blobCells(island, SAP_INNERS[f] ?? island)) },
    { terrain: 'roots', cells: blobCells(ROOTS_ISLAND, ROOTS_INNER) },
  ];
}
