import type { GridPalette } from '@art/grid';
import { C } from '@art/palette';
import { ASK_PAL, DECOR_PAL } from '../askdalr/palette';

/** Letters used in the Myrkviðr tile grids: Askdalr's letters plus the troll wood's moss and the fen. */
export const MYR_PAL: GridPalette = {
  ...ASK_PAL,
  u: '#355a2c',
  U: '#26441f',
  M: '#4f7a3a',
  S: '#8aa860',
  b: '#4a5236',
  c: '#3a4029',
  C: '#6a7a44',
  x: '#262c24',
  X: '#3e4a48',
};

/** Letters used in the Myrkviðr decor grids: Askdalr's decor letters plus earth. */
export const MYR_DECOR_PAL: GridPalette = {
  ...DECOR_PAL,
  a: C.dirt,
  z: C.dirtShade,
  y: C.dirtLight,
};
