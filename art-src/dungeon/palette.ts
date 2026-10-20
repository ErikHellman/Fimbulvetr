import type { GridPalette } from '@art/grid';
import { C } from '@art/palette';

/** The letters of the dungeons' creatures (`grids.ts`), one palette per creature. */

/** Rótarhellir's root things: bark, a slit eye, a maw, torn earth. */
export const ROOT_PAL: GridPalette = {
  '.': null,
  r: C.root,
  s: C.rootShade,
  l: C.rootLight,
  k: C.ink,
  e: '#f2d45c',
  m: '#2a1614',
  t: '#efe6cc',
  D: C.dirt,
  d: C.dirtShade,
  c: '#2e2420',
  a: C.sap,
  A: C.sapLight,
  S: C.sapShade,
  W: '#fff4c0',
};

/** The mud-crab: a shell of dried mud, rust-red claws. */
export const CRAB_PAL: GridPalette = {
  '.': null,
  h: '#6d5a3c',
  s: '#4a3c28',
  l: '#8f7a52',
  c: '#8a4a32',
  C: '#5e3222',
  L: '#b06a48',
  e: '#e8e0b0',
  k: C.ink,
};

/** The lindormr: green scales, a pale belly, the mud it rises from. */
export const LIND_PAL: GridPalette = {
  '.': null,
  g: '#3f5a44',
  s: '#2a3d2e',
  L: '#6f8f5a',
  b: '#c9b98a',
  B: '#a89a6c',
  e: '#e8d24a',
  m: '#5a1f1f',
  t: '#f0ead0',
  M: C.mud,
  N: C.mudShade,
  n: C.mudLight,
  k: C.ink,
  x: '#fff2a8',
};

/** The water-worm in its pool. */
export const WORM_PAL: GridPalette = {
  '.': null,
  w: '#4f6a3a',
  s: '#34482a',
  L: '#7a9456',
  b: '#b9b27a',
  e: '#f2e05a',
  m: '#5a1f1f',
  t: '#f0ead0',
  W: C.water,
  V: C.waterLight,
  k: C.ink,
};

/** The bog-light: a cold flame, its halo and its reflection. */
export const WISP_PAL: GridPalette = {
  '.': null,
  H: '#5fb89a',
  w: '#bfe8d8',
  c: '#ffffff',
  R: '#5fb89a',
};

/** Nykr, the Tide: a grey-green water horse with a weed mane and a rotten bridle. */
export const NYKR_PAL: GridPalette = {
  '.': null,
  h: '#4a6670',
  l: '#7c98a0',
  d: '#2c3e46',
  m: '#2e5a3a',
  M: '#4a8a52',
  b: '#6a4a2a',
  e: '#f0f4c0',
  W: '#aad2dc',
  w: '#182c34',
  F: '#e2f2f6',
  k: C.ink,
};

/** Hrönn, the great eel, and her grates. */
export const EEL_PAL: GridPalette = {
  '.': null,
  g: '#3e5a52',
  L: '#6f8f7c',
  b: '#b8c49a',
  e: '#e8f070',
  m: '#6a1e24',
  t: '#f0ece0',
  W: '#aad2dc',
  w: '#182c34',
  s: '#28463e',
  k: C.ink,
  x: '#fff2a8',
};

export const GRATE_PAL: GridPalette = {
  '.': null,
  i: '#3c3c44',
  I: '#6a6a76',
  d: '#101820',
  B: '#c8ecf4',
  k: C.ink,
};

/** Náströnd's tower shield: dark planks, an iron rim and boss. */
export const TOWER_PAL: GridPalette = {
  '.': null,
  S: '#3a3026',
  R: '#7a828e',
  B: '#c8ccd4',
  q: '#2a2219',
  k: C.ink,
};

/** The marbendill's scaled tail. */
export const TAIL_PAL: GridPalette = {
  '.': null,
  T: '#46685e',
  U: '#2f4a40',
  V: '#6f9a86',
};
