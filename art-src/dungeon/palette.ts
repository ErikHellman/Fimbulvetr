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

/** Járnvörðr, the iron warden: riveted plate round a slit of forge light. */
export const WARDEN_PAL: GridPalette = {
  '.': null,
  i: '#4a4a54',
  I: '#7a7a88',
  d: '#2a2a32',
  v: '#a8a090',
  g: '#f08a2c',
  G: '#f8d04a',
  k: C.ink,
};

/** Glóð, the ember sprite: the bog-light's grids in coal and flame. */
export const GLOD_PAL: GridPalette = {
  '.': null,
  H: '#f06a20',
  w: '#f8a040',
  c: '#fff0a0',
  R: '#f06a20',
};

/** Belgr, the bellows: a leather bag on an iron frame with a brass intake. */
export const BELGR_PAL: GridPalette = {
  '.': null,
  L: '#6a4630',
  l: '#8a6040',
  D: '#4a3020',
  i: '#4a4a54',
  I: '#7a7a88',
  d: '#2a2a32',
  v: '#a8a090',
  B: '#b08a3a',
  b: '#7a5a22',
  m: '#1a0e0a',
  F: '#f8a040',
  f: '#fff0a0',
  k: C.ink,
};

/** Ívaldi, the Anvil: a dwarf king in plate with a white beard, an iron crown and his hammer. */
export const IVALDI_PAL: GridPalette = {
  '.': null,
  p: '#5a5a66',
  P: '#8a8a98',
  q: '#2a2a32',
  s: '#c9a080',
  n: '#a07858',
  B: '#c8c0b0',
  b: '#9a9284',
  C: '#d8b040',
  c: '#9a7a22',
  j: '#c03030',
  H: '#5a3a22',
  h: '#8a5a36',
  d: '#3a3a44',
  i: '#7a7a88',
  m: '#3a1a14',
  k: C.ink,
};

/** Ívaldi's plate heated white in the forge. */
export const IVALDI_HOT_PAL: GridPalette = { ...IVALDI_PAL, p: '#f8e8c0', P: '#ffffff', q: '#f0a050' };

/** The frost wisp: a pale flame round a six-point crystal. */
export const FROST_PAL: GridPalette = {
  '.': null,
  H: '#a8d8f0',
  w: '#c4e8fa',
  c: '#ffffff',
  x: '#7ec4ec',
  R: '#a8d8f0',
};

/** A ground shadow, turned translucent black in the composers. */
export const SHADOW_KEY = '#000001';

/** Svellr, the glacier construct: packed blue ice on four stumps. */
export const SVELLR_PAL: GridPalette = {
  '.': null,
  p: '#9cc4dc',
  P: '#d4ecf8',
  q: '#5c86a4',
  c: '#24405a',
  e: '#3cc8ff',
  S: SHADOW_KEY,
  k: C.ink,
};

/** Hrímgerðr, the Glass: rime skin, a gown of ice, hair like a frozen fall, a crown of shards. */
export const HRIMGERDR_PAL: GridPalette = {
  '.': null,
  s: '#dceef8',
  t: '#9cbcd4',
  g: '#6c98bc',
  G: '#9cc0dc',
  d: '#3c6488',
  H: '#f4fbff',
  h: '#c0d8e8',
  C: '#7edcff',
  e: '#3cc8ff',
  m: '#24405a',
  o: '#b4ecff',
  O: '#ffffff',
  S: SHADOW_KEY,
  k: C.ink,
};

/** Her icicles: rime glass. */
export const ICICLE_PAL: GridPalette = {
  '.': null,
  g: '#b4dcf2',
  G: '#f0faff',
  q: '#6c9cbc',
  S: SHADOW_KEY,
};

/** Jötunvörðr: a frost-giant in a hauberk of rime over hide boots. */
export const JOTUN_PAL: GridPalette = {
  '.': null,
  r: '#b8d4ea',
  R: '#e6f4ff',
  q: '#7a9ab8',
  h: '#5a6878',
  H: '#7a8a9a',
  e: '#7edcff',
  t: '#ffc89a',
  S: SHADOW_KEY,
  k: C.ink,
};

/** Jötunvörðr thawed by Eldr: his rime glows orange and runs. */
export const JOTUN_THAW_PAL: GridPalette = {
  ...JOTUN_PAL,
  r: '#e8946a',
  R: '#ffc89a',
  q: '#b85a3a',
  e: C.ink,
};

/** Hrímnir, the Rime King, his hand and his pillars: glacier ice, a beard of snow, the heart-rune. */
export const KING_PAL: GridPalette = {
  '.': null,
  K: '#9cc4e0',
  L: '#dcf0ff',
  D: '#4c6e90',
  B: '#f0f8ff',
  b: '#c0d8ea',
  C: '#7edcff',
  e: '#7edcff',
  u: '#3c5a78',
  U: '#ff7a4a',
  m: '#1a2a3c',
  G: '#cfe8f8',
  S: SHADOW_KEY,
  k: C.ink,
};
