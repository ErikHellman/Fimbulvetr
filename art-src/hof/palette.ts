import type { GridPalette } from '@art/grid';
import { C } from '@art/palette';
import { ASK_PAL } from '../askdalr/palette';

/** Letters used in the Sökkva Hof tile grids: Askdalr's letters plus the drowned stone and the water. */
export const HOF_PAL: GridPalette = {
  ...ASK_PAL,
  a: '#4a5a56',
  b: '#2a3634',
  c: '#5a6c66',
  e: '#3e4c48',
  g: '#3c5a4a',
  A: '#5e6e68',
  B: '#3a4844',
  C: '#72827c',
  E: '#50605a',
  o: C.waterShade,
  O: C.waterLight,
  s: '#46545a',
  S: '#6c7e84',
  q: '#28323a',
};
