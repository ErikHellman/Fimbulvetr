import type { GridPalette } from '@art/grid';
import type { Raster } from '@art/raster';
import { grid } from '../lib/sprite';
import { HERO_PAL as P } from './palette';

/**
 * Ask's body parts, drawn by hand on 13 px wide strips and stacked: head (11 rows), torso (9 rows),
 * legs (6 rows). Light from the top-left: lit tones on the left and top, shade on the right and under.
 * West is drawn; east is mirrored. North is the back of the same figure.
 */

/** The drawings as text, so other figures (the villagers) can reuse Ask's body with their own palette. */

export const HEAD_TEXT = {
  s: `
    ....yhhhh....
    ..yyhhhhhhh..
    .yhhhhhhhhhg.
    .hhhhhhhhhhg.
    .hhhhhhhhhgg.
    .ghhfffffhgg.
    .gflkfffkffg.
    .gffkfffkfdg.
    ..ffffffffd..
    ..ffffdfffd..
    ...dddddd....
  `,
  w: `
    ....yhhhh....
    ..yyhhhhhhh..
    .yhhhhhhhhhg.
    .hhhhhhhhhhg.
    .hhhhhhhhhgg.
    .fffffhhhhgg.
    .lkfffhhhhgg.
    fdkfffhhhhg..
    .fffffhhhgg..
    ..ddffhhgg...
    ...dddd......
  `,
  n: `
    ....yhhhh....
    ..yyhhhhhhh..
    .yhhhhhhhhhg.
    .yhhhhhhhhhg.
    .hhhhhhhhhgg.
    .hhhhhhhhhgg.
    .hhhhhhhhggg.
    .ghhhhhhhgg..
    ..ghhhhhgg...
    ...dgggggd...
    ...dddddd....
  `,
};

/** Torsos by facing and arm swing: 0 arms down, 1 left hand forward, 2 right hand forward. */
export const TORSO_TEXT = {
  s: [
    `
    ..vttttttuu..
    .vvtttttttuu.
    .vtttttttttu.
    .vtttttttttu.
    .vtttttttttu.
    .fbbbbGbbbbd.
    .fvtttttttud.
    ..vtttttttu..
    ..uuuuuuuuu..
  `,
    `
    ..vttttttuu..
    .vvtttttttuu.
    .vtttttttttu.
    .vtttttttttu.
    .ftttttttttu.
    .fbbbbGbbbbu.
    ..vtttttttud.
    ..vtttttttud.
    ..uuuuuuuuu..
  `,
    `
    ..vttttttuu..
    .vvtttttttuu.
    .vtttttttttu.
    .vtttttttttu.
    .vtttttttttd.
    .vbbbbGbbbbd.
    .fvtttttttu..
    .fvtttttttu..
    ..uuuuuuuuu..
  `,
    `
    ..vttttttuu..
    ..vttttttuu..
    ..vtttttttu..
    ..vtttttttu..
    ..vtttttttu..
    ..bbbbGbbbb..
    ..vtttttttu..
    ..vtttttttu..
    ..uuuuuuuuu..
  `,
  ],
  w: [
    `
    ...vtttttu...
    ..vvttttttu..
    ..vvttttttu..
    ..vvttttttu..
    ..vvttttttu..
    ..fbbbbbbbu..
    ..fttttttuu..
    ...ttttttu...
    ...uuuuuu....
  `,
    `
    ...vtttttu...
    ..vvttttttu..
    .vvvttttttu..
    .vvtttttttu..
    .fttttttttu..
    .fbbbbbbbbu..
    ...ttttttuu..
    ...ttttttu...
    ...uuuuuu....
  `,
    `
    ...vtttttu...
    ..vvttttttu..
    ..vvttttttu..
    ...vtttttttu.
    ...vtttttttu.
    ...bbbbbbbfu.
    ...tttttttf..
    ...ttttttu...
    ...uuuuuu....
  `,
    `
    ...vtttttu...
    ...vtttttu...
    ...vtttttu...
    ...vtttttu...
    ...vtttttu...
    ...bbbbbbu...
    ...vttttuu...
    ...ttttttu...
    ...uuuuuu....
  `,
  ],
  n: [
    `
    ..vttttttuu..
    .vvtttttttuu.
    .vtttttttttu.
    .vtttttttttu.
    .vtttttttttu.
    .fbbbbbbbbbd.
    .fvtttttttud.
    ..vtttttttu..
    ..uuuuuuuuu..
  `,
    `
    ..vttttttuu..
    .vvtttttttuu.
    .vtttttttttu.
    .vtttttttttu.
    .vtttttttttd.
    .vbbbbbbbbbd.
    .fvtttttttu..
    .fvtttttttu..
    ..uuuuuuuuu..
  `,
    `
    ..vttttttuu..
    .vvtttttttuu.
    .vtttttttttu.
    .vtttttttttu.
    .ftttttttttu.
    .fbbbbbbbbbu.
    ..vtttttttud.
    ..vtttttttud.
    ..uuuuuuuuu..
  `,
    `
    ..vttttttuu..
    ..vttttttuu..
    ..vtttttttu..
    ..vtttttttu..
    ..vtttttttu..
    ..bbbbbbbbb..
    ..vtttttttu..
    ..vtttttttu..
    ..uuuuuuuuu..
  `,
  ],
};

/**
 * Arms raised overhead (lifting, carrying, singing), 17 px wide so they clear the head: pasted at x - 2,
 * two rows above the head. Facing west only the near arm shows.
 */
export const ARMS_UP_TEXT = {
  s: `
    lf.............fd
    ff.............dd
    vt.............tu
    vt.............tu
    vt.............tu
    vt.............tu
    vt.............tu
    vt.............tu
    vt.............tu
    vt.............tu
    vt.............tu
    vt.............tu
    vt.............tu
    vt.............tu
  `,
  w: `
    ..lf.............
    ..ff.............
    ..vt.............
    ..vt.............
    ..vt.............
    ..vt.............
    ..vt.............
    ..vt.............
    ..vt.............
    ..vt.............
    ..vt.............
    ..vt.............
    ..vvt............
    ..vvt............
  `,
  n: `
    fd.............dd
    dd.............dd
    tu.............tu
    tu.............tu
    tu.............tu
    tu.............tu
    tu.............tu
    tu.............tu
    tu.............tu
    tu.............tu
    tu.............tu
    tu.............tu
    tu.............tu
    tu.............tu
  `,
};

/** Arms thrust forward: hands low in front (south), the near arm reaching out (west), hands peeking over the shoulders (north). */
export const ARMS_FWD_TEXT = {
  s: {
    raster: `
    ..lf....fd...
    ..ff....dd...
  `,
    dx: 0,
    dy: 18,
  },
  w: {
    raster: `
    lfvvtt.......
    ffuutt.......
  `,
    dx: -2,
    dy: 13,
  },
  n: {
    raster: `
    ..dd....dd...
    ..dd....dd...
  `,
    dx: 0,
    dy: 9,
  },
};

/** Legs by facing and walk phase: 0 standing, 1 left leg forward, 2 passing, 3 right leg forward. */
export const LEGS_TEXT = {
  s: [
    `
    ....pp.pp....
    ....pp.qq....
    ....qq.qq....
    ...ono.ono...
    ...ooo.ooo...
    ...ooo.ooo...
  `,
    `
    ....pp.pp....
    ....pp.qq....
    ....qq.ono...
    ...ono.ooo...
    ...ooo.ooo...
    ...ooo.......
  `,
    `
    ....pp.pp....
    ....pp.qq....
    ....qq.qq....
    ...ono.ono...
    ...ooo.ooo...
    ...ooo.ooo...
  `,
    `
    ....pp.pp....
    ....pp.qq....
    ...ono.qq....
    ...ooo.ono...
    ...ooo.ooo...
    .......ooo...
  `,
  ],
  w: [
    `
    ....ppqq.....
    ....ppqq.....
    ....ppqq.....
    ...nooqq.....
    ..nooo.oo....
    ..oooo.oo....
  `,
    `
    ....ppqq.....
    ...pp..qq....
    ..ppp...qq...
    .noo.....qq..
    .ooo.....oo..
    .........oo..
  `,
    `
    ....ppqq.....
    ....ppqq.....
    ....ppqq.....
    ...nooqq.....
    ..nooo.oo....
    ..oooo.oo....
  `,
    `
    ....ppqq.....
    ....ppqq.....
    .....pqq.....
    ...noopqq....
    ..nooo.qq....
    .........oo..
  `,
  ],
  n: [
    `
    ....pp.pp....
    ....pp.qq....
    ....qq.qq....
    ....oo.oo....
    ...ooo.ooo...
    ...ooo.ooo...
  `,
    `
    ....pp.pp....
    ....pp.qq....
    ....oo.qq....
    ...ooo.oo....
    ...ooo.ooo...
    .......ooo...
  `,
    `
    ....pp.pp....
    ....pp.qq....
    ....qq.qq....
    ....oo.oo....
    ...ooo.ooo...
    ...ooo.ooo...
  `,
    `
    ....pp.pp....
    ....pp.qq....
    ....qq.oo....
    ....oo.ooo...
    ...ooo.ooo...
    ...ooo.......
  `,
  ],
};

type Grids<T> = {
  [K in keyof T]: T[K] extends string
    ? Raster
    : T[K] extends readonly string[]
      ? Raster[]
      : T[K] extends { raster: string }
        ? Omit<T[K], 'raster'> & { raster: Raster }
        : never;
};

/** Renders a set of text grids with a palette. */
export function render<T extends Record<string, unknown>>(texts: T, pal: GridPalette): Grids<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(texts)) {
    if (typeof v === 'string') out[k] = grid(pal, v);
    else if (Array.isArray(v)) out[k] = v.map((t) => grid(pal, t as string));
    else if (typeof v === 'object' && v !== null && 'raster' in v)
      out[k] = { ...v, raster: grid(pal, (v as { raster: string }).raster) };
  }
  return out as Grids<T>;
}

export const HEAD = render(HEAD_TEXT, P);
export const TORSO = render(TORSO_TEXT, P);
export const ARMS_UP = render(ARMS_UP_TEXT, P);
export const ARMS_FWD = render(ARMS_FWD_TEXT, P);
export const LEGS = render(LEGS_TEXT, P);
