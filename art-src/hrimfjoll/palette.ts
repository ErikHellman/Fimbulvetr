import type { GridPalette } from '@art/grid';
import { C } from '@art/palette';
import { ASK_PAL } from '../askdalr/palette';

/** Letters used in the Hrímfjöll tile grids: Askdalr's letters plus snow, ice, rime and the tower's stone. */
export const HRF_PAL: GridPalette = {
  ...ASK_PAL,
  S: C.snow,
  n: C.snowShade,
  w: C.snowLight,
  I: '#9cc8e4',
  i: '#86b4d4',
  j: '#b8dcf0',
  J: '#e8f6ff',
  r: '#5e7e9c',
  q: '#7898b6',
  R: '#46627e',
  l: '#c8dcec',
  f: '#b4c8da',
  F: '#90a8c0',
  h: '#e0eef8',
  v: '#3e5672',
  u: '#567090',
  V: '#2c3e56',
  x: '#8eaecc',
  C: '#c4e4f6',
  c: '#8cb8d6',
};
