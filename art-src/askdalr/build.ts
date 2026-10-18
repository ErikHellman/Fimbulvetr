import { outline } from '@art/outline';
import { C } from '@art/palette';
import { createRaster, getPixel, hex, setPixel, type Raster } from '@art/raster';
import type { DrawnFrame } from '../lib/sprite';
import {
  BIRCH,
  BOULDER,
  MENHIR,
  PINE,
  PINE_OLD,
  PINE_TALL,
  RUNESTONE,
  STUMP,
  TREE,
  TREE_OLD,
  TREE_YOUNG,
  WELL,
} from './decor';
import { BLOB_MASKS, E, N, NE, NW, S, SE, SW, W } from '@core/world/autotile';
import { TILE } from '@core/world/dims';
import {
  FENCE,
  FIELD,
  FORD_INNER,
  FORD_ISLAND,
  GRASS,
  PATH,
  ROCK_INNER,
  ROCK_ISLAND,
  ROOF_INNER,
  ROOF_ISLAND,
  WATER_INNER,
  WATER_ISLAND,
  YARD,
} from './tiles';

const Q = TILE / 2;

/** A terrain's sheet: its 16 px cells in tileset order. */
export interface TileSheet {
  readonly terrain: string;
  readonly cells: readonly Raster[];
}

function copy(
  dst: Raster,
  dx: number,
  dy: number,
  src: Raster,
  sx: number,
  sy: number,
  w: number,
  h: number,
): void {
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) setPixel(dst, dx + x, dy + y, getPixel(src, sx + x, sy + y));
}

/**
 * One quarter of a blob cell. `a` is the cardinal neighbour along the quarter's vertical side, `b` along
 * its horizontal side, `d` the diagonal between them. `qx`, `qy` pick the quarter (0 or 1).
 */
function quarter(
  cell: Raster,
  island: Raster,
  inner: Raster,
  mask: number,
  qx: number,
  qy: number,
  a: number,
  b: number,
  d: number,
): void {
  const hasA = (mask & a) !== 0;
  const hasB = (mask & b) !== 0;
  const hasD = (mask & d) !== 0;
  const dx = qx * Q;
  const dy = qy * Q;
  // Island layout: outer corners at the corners, edges along the sides, interior in the middle 16×16.
  const far = (q: number): number => (q === 0 ? 0 : 3 * Q); // the island's outer corner/edge column or row
  const mid = (q: number): number => Q + q * Q; // the island's interior quarter
  if (hasA && hasB && hasD) copy(cell, dx, dy, island, mid(qx), mid(qy), Q, Q);
  else if (hasA && hasB) copy(cell, dx, dy, inner, dx, dy, Q, Q);
  else if (hasA)
    copy(cell, dx, dy, island, far(qx), mid(qy), Q, Q); // vertical neighbour only: a side edge
  else if (hasB)
    copy(cell, dx, dy, island, mid(qx), far(qy), Q, Q); // horizontal neighbour only: a top/bottom edge
  else copy(cell, dx, dy, island, far(qx), far(qy), Q, Q);
}

/** The 47 blob cells, in `BLOB_MASKS` order, cut from an island and an inner-corner tile. */
export function blobCells(island: Raster, inner: Raster): Raster[] {
  return BLOB_MASKS.map((mask) => {
    const cell = createRaster(TILE, TILE);
    quarter(cell, island, inner, mask, 0, 0, N, W, NW);
    quarter(cell, island, inner, mask, 1, 0, N, E, NE);
    quarter(cell, island, inner, mask, 0, 1, S, W, SW);
    quarter(cell, island, inner, mask, 1, 1, S, E, SE);
    return cell;
  });
}

const framed = (islands: readonly Raster[], inners: readonly Raster[]): Raster[] =>
  islands.flatMap((island, f) => {
    const inner = inners[f] ?? inners[0];
    if (inner === undefined) throw new Error('no inner tile');
    return blobCells(island, inner);
  });

/** Askdalr's drawn tile sheets, one per terrain, in the order the tileset expects. */
export function askdalrSheets(): TileSheet[] {
  return [
    { terrain: 'grass', cells: GRASS },
    { terrain: 'path', cells: PATH },
    { terrain: 'yard', cells: YARD },
    { terrain: 'field', cells: FIELD },
    { terrain: 'fence', cells: [FENCE] },
    { terrain: 'rock', cells: blobCells(ROCK_ISLAND, ROCK_INNER) },
    { terrain: 'roof', cells: blobCells(ROOF_ISLAND, ROOF_INNER) },
    { terrain: 'water', cells: framed(WATER_ISLAND, WATER_INNER) },
    { terrain: 'ford', cells: framed(FORD_ISLAND, FORD_INNER) },
  ];
}

/** Lays cells out as a sheet image, `perRow` cells wide (the loader reads them back in the same order). */
export function sheetImage(cells: readonly Raster[], perRow = 12): Raster {
  const rows = Math.ceil(cells.length / perRow);
  const r = createRaster(perRow * TILE, rows * TILE);
  cells.forEach((c, i) => {
    copy(r, (i % perRow) * TILE, Math.floor(i / perRow) * TILE, c, 0, 0, TILE, TILE);
  });
  return r;
}

/** A decor frame stands on its bottom centre, outlined in ink like the placeholder decor. */
function standing(name: string, r: Raster): DrawnFrame {
  const raster = outline(r, hex(C.ink), 1);
  return { name, raster, pivot: { x: Math.floor(raster.w / 2) / raster.w, y: (raster.h - 1) / raster.h } };
}

/** Askdalr's drawn trees, stones and the well, under the placeholder decor names. */
export function askdalrDecor(): DrawnFrame[] {
  const still: readonly (readonly [string, Raster])[] = [
    ['tree', TREE],
    ['tree_young', TREE_YOUNG],
    ['tree_old', TREE_OLD],
    ['pine', PINE],
    ['pine_tall', PINE_TALL],
    ['pine_old', PINE_OLD],
    ['birch', BIRCH],
    ['boulder', BOULDER],
    ['stump', STUMP],
    ['menhir', MENHIR],
    ['runestone', RUNESTONE],
  ];
  return [
    ...still.map(([id, r]) => standing(`decor_${id}_idle_s_0`, r)),
    ...WELL.map((r, f) => standing(`decor_well_idle_s_${String(f)}`, r)),
  ];
}
