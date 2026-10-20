import type { DrawnFrame } from '../lib/sprite';
import { blobCells, standing, type TileSheet } from '../askdalr/build';
import { ANVIL, BOAT, MILL, STALL, THINGSTONE } from './decor';
import {
  ANVIL_GROUND,
  BOAT_GROUND,
  MILL_GROUND,
  PALISADE,
  PEAT,
  PLANKS,
  SAND,
  SHOAL_INNER,
  SHOAL_ISLAND,
  SILT,
  SPRING_INNER,
  SPRING_ISLAND,
  STALL_GROUND,
  THINGSTONE_GROUND,
} from './tiles';

const framed = (
  islands: readonly import('@art/raster').Raster[],
  inners: readonly import('@art/raster').Raster[],
) => islands.flatMap((island, f) => blobCells(island, inners[f] ?? island));

/** Mýrland's and Uppvík's drawn tile sheets, one per terrain. */
export function myrlandSheets(): TileSheet[] {
  return [
    { terrain: 'sand', cells: SAND },
    { terrain: 'peat', cells: PEAT },
    { terrain: 'silt', cells: SILT },
    { terrain: 'spring', cells: framed(SPRING_ISLAND, SPRING_INNER) },
    { terrain: 'shoal', cells: framed(SHOAL_ISLAND, SHOAL_INNER) },
    { terrain: 'planks', cells: PLANKS },
    { terrain: 'palisade', cells: [PALISADE] },
    { terrain: 'mill', cells: [MILL_GROUND] },
    { terrain: 'boat', cells: [BOAT_GROUND] },
    { terrain: 'anvil', cells: [ANVIL_GROUND] },
    { terrain: 'stall', cells: [STALL_GROUND] },
    { terrain: 'thingstone', cells: [THINGSTONE_GROUND] },
  ];
}

/** Mýrland's and Uppvík's drawn decor, under the placeholder names. */
export function myrlandDecor(): DrawnFrame[] {
  return [
    standing('decor_mill_idle_s_0', MILL),
    standing('decor_boat_idle_s_0', BOAT),
    standing('decor_stall_idle_s_0', STALL),
    standing('decor_thingstone_idle_s_0', THINGSTONE),
    standing('decor_anvil_idle_s_0', ANVIL),
  ];
}
