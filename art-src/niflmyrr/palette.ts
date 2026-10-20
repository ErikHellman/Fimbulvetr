import type { GridPalette } from '@art/grid';
import { ASK_PAL, DECOR_PAL } from '../askdalr/palette';

/** Letters used in the Niflmýrr tile grids: Askdalr's letters plus the sedge mire and the black pools. */
export const NIF_PAL: GridPalette = {
  ...ASK_PAL,
  a: '#4e5a4c',
  b: '#3c463b',
  c: '#6c7a64',
  h: '#8e9a84',
  p: '#2f2b24',
  X: '#1c2224',
  x: '#121618',
  y: '#283032',
  z: '#3a4642',
  Z: '#5a6a68',
  u: '#9a9a8c',
  U: '#6a6a5e',
};

/** Letters used in the Niflmýrr decor grids: Askdalr's decor letters plus bleached dead wood. */
export const NIF_DECOR_PAL: GridPalette = {
  ...DECOR_PAL,
  u: '#9a9a8c',
  U: '#6a6a5e',
};
