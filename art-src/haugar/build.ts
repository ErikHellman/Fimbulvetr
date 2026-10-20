import type { DrawnFrame } from '../lib/sprite';
import { blobCells, standing, type TileSheet } from '../askdalr/build';
import { CAIRN, TENT } from './decor';
import {
  BARROW_INNER,
  BARROW_ISLAND,
  CAIRN_GROUND,
  DRYSTONE_INNER,
  DRYSTONE_ISLAND,
  FLAGSTONE,
  HEATH,
  TENT_GROUND,
} from './tiles';

/** Haugar's drawn tile sheets, one per terrain. */
export function haugarSheets(): TileSheet[] {
  return [
    { terrain: 'heath', cells: HEATH },
    { terrain: 'barrow', cells: blobCells(BARROW_ISLAND, BARROW_INNER) },
    { terrain: 'flagstone', cells: FLAGSTONE },
    { terrain: 'drystone', cells: blobCells(DRYSTONE_ISLAND, DRYSTONE_INNER) },
    { terrain: 'cairn', cells: [CAIRN_GROUND] },
    { terrain: 'tent', cells: [TENT_GROUND] },
  ];
}

/** Haugar's drawn decor, under the placeholder names. */
export function haugarDecor(): DrawnFrame[] {
  return [standing('decor_cairn_idle_s_0', CAIRN), standing('decor_tent_idle_s_0', TENT)];
}
