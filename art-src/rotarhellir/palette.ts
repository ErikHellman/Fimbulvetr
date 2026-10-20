import type { GridPalette } from '@art/grid';
import { C } from '@art/palette';
import { DVG_PAL } from '../dvergagrof/palette';

/** Letters used in the Rótarhellir tile grids: the cave floor's letters plus sap and root. */
export const ROT_PAL: GridPalette = {
  ...DVG_PAL,
  S: C.sap,
  Z: C.sapShade,
  Y: C.sapLight,
  d: '#5a3a0e',
  r: C.rootShade,
  o: C.root,
  O: C.rootLight,
  q: '#3e2c20',
};
