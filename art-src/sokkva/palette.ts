import type { GridPalette } from '@art/grid';
import { C } from '@art/palette';
import { ASK_PAL } from '../askdalr/palette';

/** Letters used in the Sökkva Kvern tile grids: Askdalr's letters plus wet stone, silt and black timber. */
export const SOK_PAL: GridPalette = {
  ...ASK_PAL,
  a: '#4e535c',
  b: '#3a3e46',
  c: '#62676f',
  d: '#2a2d34',
  e: '#767b84',
  A: C.rock,
  B: C.rockShade,
  C: C.rockLight,
  D: '#c8ccd4',
  m: '#4a4036',
  M: '#3a322a',
  n: '#2a2420',
  w: C.woodShade,
  W: C.wood,
  x: '#3e2816',
  u: C.mudShade,
};
