import type { GridPalette } from '@art/grid';
import { ASK_PAL } from '../askdalr/palette';

/** Letters used in the Útgarðr tile grids: Askdalr's letters plus the giants' blue-grey stone and frost. */
export const UTG_PAL: GridPalette = {
  ...ASK_PAL,
  a: '#8a96a4',
  b: '#9ca8b4',
  c: '#d8e4ee',
  d: '#6a7684',
  e: '#56606c',
  f: '#7e8a98',
  v: '#4a5462',
  u: '#5e6a7a',
  z: '#3c4452',
  x: '#343c48',
  y: '#2e3540',
  h: '#b8d0e4',
  H: '#dcecf6',
};
