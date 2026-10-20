import type { GridPalette } from '@art/grid';
import { C } from '@art/palette';
import { ASK_PAL } from '../askdalr/palette';

/** Letters used in the Dvergagröf tile grids: Askdalr's letters plus the scree and the cave's rock. */
export const DVG_PAL: GridPalette = {
  ...ASK_PAL,
  a: '#7a7672',
  b: '#68645f',
  c: '#54504c',
  A: '#9a9690',
  f: C.caveFloor,
  F: C.caveFloorShade,
  h: C.caveFloorLight,
  v: C.caveWall,
  V: C.caveWallShade,
  x: C.caveWallLight,
};
