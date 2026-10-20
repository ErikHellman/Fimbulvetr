import type { GridPalette } from '@art/grid';
import { C } from '@art/palette';
import { ASK_PAL, DECOR_PAL } from '../askdalr/palette';

/** Letters used in the Haugar tile grids: Askdalr's letters plus the heath and the heather in bloom. */
export const HAU_PAL: GridPalette = {
  ...ASK_PAL,
  a: '#6f6a44',
  b: '#57533a',
  c: '#8a8560',
  m: '#8a5a7a',
  M: '#b07aa0',
  n: '#8a9a5a',
};

/** Letters used in the Haugar decor grids: Askdalr's decor letters plus hide, lichen and the tent's inside. */
export const HAU_DECOR_PAL: GridPalette = {
  ...DECOR_PAL,
  u: C.sackShade,
  U: '#5a4730',
  v: '#b9a47c',
  q: '#7d6646',
  x: '#2a2018',
};
