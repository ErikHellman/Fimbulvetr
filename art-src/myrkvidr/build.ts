import type { DrawnFrame } from '../lib/sprite';
import { blobCells, standing, type TileSheet } from '../askdalr/build';
import { KILN, LOG, REEDS } from './decor';
import {
  BOG,
  BOULDER_GROUND,
  CAVE_MOUTH,
  KILN_GROUND,
  MOSS,
  MOUND,
  RAPIDS_INNER,
  RAPIDS_ISLAND,
} from './tiles';

/** Myrkviðr's drawn tile sheets, one per terrain. */
export function myrkvidrSheets(): TileSheet[] {
  return [
    { terrain: 'moss', cells: MOSS },
    { terrain: 'bog', cells: BOG },
    { terrain: 'reeds', cells: [BOG[1] ?? BOULDER_GROUND] },
    { terrain: 'boulder', cells: [BOULDER_GROUND] },
    { terrain: 'mound', cells: MOUND },
    { terrain: 'cave_mouth', cells: [CAVE_MOUTH] },
    { terrain: 'kiln', cells: [KILN_GROUND] },
    {
      terrain: 'rapids',
      cells: RAPIDS_ISLAND.flatMap((island, f) => blobCells(island, RAPIDS_INNER[f] ?? island)),
    },
  ];
}

/** Myrkviðr's drawn decor, under the placeholder names. */
export function myrkvidrDecor(): DrawnFrame[] {
  return [
    standing('decor_kiln_idle_s_0', KILN),
    standing('decor_reeds_idle_s_0', REEDS),
    standing('decor_log_idle_s_0', LOG),
  ];
}
