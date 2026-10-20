import type { GridPalette } from '@art/grid';
import { C } from '@art/palette';
import { ASK_PAL, DECOR_PAL } from '../askdalr/palette';

/** Letters used in the Mýrland tile grids: Askdalr's letters plus sand, peat, silt and the warm springs. */
export const MYL_PAL: GridPalette = {
  ...ASK_PAL,
  n: '#d6c48f',
  m: '#b8a36e',
  h: '#eee0b0',
  a: C.mud,
  b: C.mudShade,
  c: C.mudLight,
  x: '#2e231a',
  v: '#7a6f60',
  V: '#5e5448',
  Z: '#978b78',
  S: C.spring,
  u: C.springShade,
  U: C.springLight,
  I: '#8fd0cc',
};

/** Letters used in the Mýrland decor grids: Askdalr's decor letters plus steel and the awning's shade. */
export const MYL_DECOR_PAL: GridPalette = {
  ...DECOR_PAL,
  i: C.steel,
  j: C.steelShade,
  q: C.woodShade,
};
