import type { GridPalette } from '@art/grid';
import { C } from '@art/palette';

/** A beast's colours, mapped onto the letters its grids are drawn in. */
export interface Coat {
  readonly fur: string;
  readonly shade: string;
  readonly light: string;
  readonly eye: string;
  /** The fangs and claws. */
  readonly bone: string;
  /** A pale ruff about the neck (the pack leader); without one the ruff is drawn in the lit fur. */
  readonly ruff?: string;
}

/** The wolf grids: f fur, s shade, l light, e eye, w fang, r ruff, n nose, k ink. */
export function wolfPalette(c: Coat): GridPalette {
  return {
    '.': null,
    k: C.ink,
    n: C.ink,
    f: c.fur,
    s: c.shade,
    l: c.light,
    e: c.eye,
    w: c.bone,
    r: c.ruff ?? c.light,
  };
}

export const GREY_WOLF: Coat = {
  fur: '#7a7470',
  shade: '#524d4a',
  light: '#a39d98',
  eye: '#f2d45c',
  bone: '#f4efe2',
};
export const ALPHA_WOLF: Coat = {
  fur: '#3e3a3c',
  shade: '#262325',
  light: '#6a6466',
  eye: '#e0503a',
  bone: '#f4efe2',
  ruff: '#d8d4cc',
};

/** A troll's colours: h hide, s shade, l light, m moss, o loin, t tusk, e eye, c club, C club light, k ink. */
export interface Hide {
  readonly hide: string;
  readonly shade: string;
  readonly light: string;
  readonly moss: string;
  readonly loin: string;
  readonly tusk: string;
  readonly eye: string;
  readonly club: string;
  readonly clubLight: string;
}

export function trollPalette(h: Hide): GridPalette {
  return {
    '.': null,
    k: C.ink,
    h: h.hide,
    s: h.shade,
    l: h.light,
    m: h.moss,
    o: h.loin,
    t: h.tusk,
    e: h.eye,
    c: h.club,
    C: h.clubLight,
  };
}

export const RAID_TROLL: Hide = {
  hide: '#7f8c64',
  shade: '#5a6645',
  light: '#a2ad84',
  moss: '#48602f',
  loin: C.wood,
  tusk: '#efe8d0',
  eye: '#f0c040',
  club: C.woodShade,
  clubLight: C.wood,
};
export const FOREST_TROLL: Hide = {
  hide: '#6b6a4e',
  shade: '#4a4a34',
  light: '#8e8c68',
  moss: '#3d6a2c',
  loin: '#5a4630',
  tusk: '#e8dcc0',
  eye: '#e8a030',
  club: '#4a3524',
  clubLight: '#6a4e34',
};
/** Stone keeps the shape and loses the life: no eyes shine in it. */
export const STONE_TROLL: Hide = {
  hide: C.rock,
  shade: C.rockShade,
  light: C.rockLight,
  moss: '#5d7a4a',
  loin: C.rockShade,
  tusk: C.rockLight,
  eye: C.rockShade,
  club: C.rockShade,
  clubLight: C.rock,
};

/** The raven: b black, d its shade, i rime (frost on the wing tips), e eye, y beak, a shadow on the ground, k ink. */
export const RAVEN_PAL: GridPalette = {
  '.': null,
  k: C.ink,
  b: '#1e2230',
  d: '#0f1119',
  g: '#343a4c',
  i: '#cfe6f2',
  e: '#8fd8ff',
  y: '#3a3a44',
  a: '#20242c',
};
