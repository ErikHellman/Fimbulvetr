import type { Raster } from '@art/raster';
import { grid, mirror, rot90, flipY } from '../lib/sprite';
import { HERO_PAL as P } from './palette';

const g = (text: string) => grid(P, text);

export type Blade = 'sword' | 'axe' | 'fork';
export type Dir8 = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

/** A held prop: its pixels and where the hand holds it. */
export interface Prop {
  readonly raster: Raster;
  readonly hand: { readonly x: number; readonly y: number };
}

const prop = (raster: Raster, x: number, y: number): Prop => ({ raster, hand: { x, y } });

/** Drawn pointing east and north-east; the other six directions are turns and mirrors of these. */
const BLADES: Record<Blade, { e: Prop; ne: Prop }> = {
  sword: {
    e: prop(
      g(`
      ...GWWWWWWW.
      rrrGwwwwwwwW
      ...Gxxxxxxx.
    `),
      1,
      1,
    ),
    ne: prop(
      g(`
      ........W
      .......wW
      ......wwx
      .....wwx.
      ....wwx..
      ...wwx...
      ..GGx....
      .rrG.....
      r........
    `),
      1,
      7,
    ),
  },
  axe: {
    e: prop(
      g(`
      .........ww
      ........wwW
      rrrrrrrrxwW
      ........xxw
      .........xx
    `),
      2,
      2,
    ),
    ne: prop(
      g(`
      .......xww
      ......wwwW
      .....rxwwW
      ....r..xxw
      ...r.....x
      ..r.......
      .r........
      r.........
    `),
      1,
      6,
    ),
  },
  fork: {
    e: prop(
      g(`
      .............www
      ............x...
      rrrrrrrrrrrrxwww
      ............x...
      .............www
    `),
      3,
      2,
    ),
    ne: prop(
      g(`
      ..........w.W
      .........wxW.
      ........rxW..
      .......r.W...
      ......r......
      .....r.......
      ....r........
      ...r.........
      ..r..........
      .r...........
      r............
    `),
      2,
      8,
    ),
  },
};

function turn(p: Prop): Prop {
  // Clockwise quarter turn: (x, y) -> (h - 1 - y, x).
  return prop(rot90(p.raster), p.raster.h - 1 - p.hand.y, p.hand.x);
}

function mirrorProp(p: Prop): Prop {
  return prop(mirror(p.raster), p.raster.w - 1 - p.hand.x, p.hand.y);
}

function flipProp(p: Prop): Prop {
  return prop(flipY(p.raster), p.hand.x, p.raster.h - 1 - p.hand.y);
}

/** The blade in every direction: east and north-east drawn, the rest turned from them. */
export function blade(kind: Blade, dir: Dir8): Prop {
  const { e, ne } = BLADES[kind];
  switch (dir) {
    case 'e':
      return e;
    case 's':
      return turn(e);
    case 'w':
      return mirrorProp(e);
    case 'n':
      return flipProp(turn(e));
    case 'ne':
      return ne;
    case 'se':
      return turn(ne);
    case 'sw':
      return mirrorProp(turn(ne));
    case 'nw':
      return mirrorProp(ne);
  }
}

/** The round shield: seen from the front, edge-on at the side, and its wooden back. */
export const SHIELD = {
  front: g(`
    ...GGGGG...
    .GGRRRRRGG.
    .GRRRRRRQG.
    GRRRRwwRQQG
    GRRRwWwRQQG
    GRRRRwwQQQG
    GRRRRRRQQQG
    .GRRRRQQQG.
    .GGRQQQQGG.
    ...GGGGG...
  `),
  side: g(`
    .G.
    GRG
    GRQ
    GRQ
    GRQ
    GRQ
    GRQ
    GRQ
    GRQ
    GQG
    .G.
  `),
  back: g(`
    ...GGGG...
    .GGrrrrGG.
    .GrrrrrrG.
    GrrrbbrrrG
    GrrrbbrrrG
    GrrrrrrrrG
    .GrrrrrrG.
    .GGrrrrGG.
    ...GGGG...
  `),
};

/** Ask curled up mid-roll, head up; the other three frames turn it. */
export const ROLL = g(`
  ....yhhhh...
  ..yhhhhhhhg.
  .yhhhhhhhhg.
  .hhhhhhhhhgg
  vtthhhhhhgtu
  vttttttttuuu
  vtttbbbbtuuu
  vttttttttuuu
  .tttttttuuu.
  .nooottuuoo.
  ..ooo..uoo..
  ............
`);

/** Ask knocked out on his side: head to the west, boots to the east. */
export const FALLEN = g(`
  ....hhh....................
  ..yhhhhhhvtttttttt.........
  .yhhhhhfhvttttttttpppooo...
  .hhhhfffdvtttbtttpppqooo...
  ..hhfffddtttubtttuqqqoo....
  ...dddd..uuuuuuuuuuuqq.....
`);
