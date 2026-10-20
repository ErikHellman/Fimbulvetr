import type { GridPalette } from '@art/grid';
import { C } from '@art/palette';
import { ASK_PAL } from '../askdalr/palette';

/** Letters used in the Forge tile grids: Askdalr's letters plus the forge's iron, stone, rubber and melt. */
export const FORGE_PAL: GridPalette = {
  ...ASK_PAL,
  f: '#4a4442',
  F: '#2c2826',
  h: '#5a5452',
  e: '#6a3a2a',
  i: '#8a8a90',
  I: '#b4b4b8',
  s: '#5a5a60',
  v: '#262224',
  u: '#3a3436',
  V: '#18161a',
  L: '#c4421a',
  l: '#a83414',
  G: C.ember,
  B: C.emberLight,
  K: '#3a1a12',
  b: '#3a3634',
  c: '#443e3c',
  C: '#5c5652',
  d: '#2e2a28',
};
