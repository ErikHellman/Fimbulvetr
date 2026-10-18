import type { GridPalette } from '@art/grid';
import { C } from '@art/palette';

/**
 * Letters used in Embla's grids. Her placeholder colours (`LOOKS.embla` in `art/sprites/people.ts`)
 * set the key tones: copper braid, a leaf-green bodice over a darker skirt, a linen apron panel.
 */
export const EMBLA_PAL: GridPalette = {
  '.': null,
  k: C.ink,
  f: C.skin,
  d: C.skinShade,
  l: C.skinLight,
  h: '#b0522d',
  g: '#80381c',
  y: '#d4784a',
  t: '#4f8a5b',
  u: '#3b6b45',
  v: '#6aa374',
  s: '#3d6e48',
  S: '#2c5235',
  z: '#4f8a5b',
  A: '#e8dcc0',
  E: '#cdbf9c',
  b: C.belt,
  o: C.boot,
  n: C.bootLight,
};
