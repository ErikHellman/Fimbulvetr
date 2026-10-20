import type { Raster } from '@art/raster';
import type { DrawnFrame } from '../lib/sprite';
import { blobCells, standing, type TileSheet } from '../askdalr/build';
import { SNAG } from './decor';
import { BLACK_INNER, BLACK_ISLAND, MIRE, SNAG_GROUND } from './tiles';

const framed = (islands: readonly Raster[], inners: readonly Raster[]): Raster[] =>
  islands.flatMap((island, f) => blobCells(island, inners[f] ?? island));

/** Niflmýrr's drawn tile sheets, one per terrain. */
export function niflmyrrSheets(): TileSheet[] {
  const black = framed(BLACK_ISLAND, BLACK_INNER);
  return [
    { terrain: 'mire', cells: MIRE },
    { terrain: 'blackwater', cells: black },
    // The drowned path is drawn as the black water it runs under: only light shows it.
    { terrain: 'drowned_path', cells: black },
    { terrain: 'snag', cells: [SNAG_GROUND] },
  ];
}

/** Niflmýrr's drawn decor, under the placeholder names. */
export function niflmyrrDecor(): DrawnFrame[] {
  return [standing('decor_snag_idle_s_0', SNAG)];
}
