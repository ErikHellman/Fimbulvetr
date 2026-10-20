import type { GridPalette } from '@art/grid';
import { ASK_PAL } from '../askdalr/palette';

/** Letters used in the Konungshaugr tile grids: Askdalr's letters plus the crypt's stone and the pits. */
export const KON_PAL: GridPalette = {
  ...ASK_PAL,
  a: '#5a5550',
  b: '#3a3632',
  c: '#6e6860',
  e: '#4a4540',
  v: '#3a3230',
  V: '#2a2422',
  w: '#4e4440',
  P: '#0c0a0c',
  p: '#141014',
  E: '#2a2522',
};
