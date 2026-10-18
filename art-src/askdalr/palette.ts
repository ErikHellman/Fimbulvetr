import type { GridPalette } from '@art/grid';
import { C } from '@art/palette';

/** Letters used in the Askdalr tile grids: summer noon, graded by the shell's colour matrix. */
export const ASK_PAL: GridPalette = {
  '.': null,
  k: C.ink,
  G: C.grass,
  g: C.grassShade,
  L: C.grassLight,
  r: C.rock,
  R: C.rockShade,
  l: C.rockLight,
  T: C.turf,
  t: C.turfShade,
  Y: C.turfLight,
  e: C.leafShade,
  W: C.water,
  w: C.waterShade,
  B: C.waterLight,
  D: C.dirt,
  d: C.dirtShade,
  E: C.dirtLight,
  F: C.barley,
  f: C.barleyShade,
  H: C.barleyLight,
  O: C.woodLight,
  o: C.wood,
  q: C.woodShade,
};
