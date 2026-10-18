import { grid } from '../lib/sprite';
import { EMBLA_PAL as P } from './palette';

/**
 * Embla's parts on the same 13 px strips as Ask: head (11 rows), bodice (7 rows), skirt with feet
 * (8 rows). The braid is a separate overlay so it can hang over the shoulder (south), down the back
 * (west) or straight down the spine (north).
 */
const g = (text: string) => grid(P, text);

export const HEAD = {
  s: g(`
    ....yhhhh....
    ..yyhhhhhhh..
    .yhhhhhhhhhg.
    .hhyhhhhhhhg.
    .hhhfffffhgg.
    .ghfffffffgg.
    .gflkfffkffg.
    .hffkfffkfdh.
    .hfffffffffg.
    ..hffddffdg..
    ...dddddd....
  `),
  w: g(`
    ....yhhhh....
    ..yyhhhhhhh..
    .yhhhhhhhhhg.
    .hhhhhhhhhhg.
    .hfffhhhhhgg.
    .fffffhhhhgg.
    .lkffffhhhgg.
    fdkfffhhhhgg.
    .ffffhhhhhgg.
    ..ddfhhhhgg..
    ...ddhhgg....
  `),
  n: g(`
    ....yhhhh....
    ..yyhhhhhhh..
    .yhhhhhhhhhg.
    .yhhhhhhhhhg.
    .hhhhhhhhhgg.
    .hhhhhhhhhgg.
    .hhhhhhhhggg.
    .ghhhhhhhgg..
    ..ghhhhhgg...
    ...dghhggd...
    ...ddhhgd....
  `),
};

/** The braid, pasted after the bodice: over the right shoulder (s), down the back (w, n). */
export const BRAID = {
  s: {
    raster: g(`
    hg.
    ghg
    hgh
    ghg
    hgh
    .gh
    .bb
    .g.
  `),
    dx: 1,
    dy: 10,
  },
  w: {
    raster: g(`
    hg
    gh
    hg
    gh
    hg
    bb
    g.
  `),
    dx: 9,
    dy: 11,
  },
  n: {
    raster: g(`
    ghg
    hgh
    ghg
    hgh
    ghg
    hgh
    .bb
    .g.
  `),
    dx: 5,
    dy: 10,
  },
};

/** Bodice with the arms down; the walk swings the hands a pixel. */
export const BODICE = {
  s: [
    g(`
    ..vttttttuu..
    .vvtttttttuu.
    .vtttttttttu.
    .ftttttttttd.
    .fbbbbbbbbbd.
    ..vtttttttu..
    ..vtttttttu..
  `),
    g(`
    ..vttttttuu..
    .vvtttttttuu.
    .ftttttttttu.
    .ftttttttttd.
    .vbbbbbbbbbd.
    ..vtttttttu..
    ..vtttttttu..
  `),
    g(`
    ..vttttttuu..
    .vvtttttttuu.
    .vtttttttttd.
    .ftttttttttd.
    .fbbbbbbbbbu.
    ..vtttttttu..
    ..vtttttttu..
  `),
  ],
  w: [
    g(`
    ..vttttuu....
    .vvtttttuu...
    .vtttutttu...
    .vtttutttu...
    .vbbbubbbu...
    ..vttfttu....
    ..vtttttu....
  `),
    g(`
    ..vttttuu....
    .vvtttttuu...
    .vttutttuu...
    .vttuttttu...
    .vbbubbbbu...
    ..vftttttu...
    ..vtttttu....
  `),
    g(`
    ..vttttuu....
    .vvtttttuu...
    .vttttutttu..
    .vttttuttu...
    .vbbbbubbu...
    ..vtttfttu...
    ..vtttttu....
  `),
  ],
  n: [
    g(`
    ..vttttttuu..
    .vvtttttttuu.
    .dvtttttttud.
    .dvtttttttud.
    .dbbbbbbbbbd.
    ..vtttttttu..
    ..vtttttttu..
  `),
  ],
};

/** Skirt and feet per walk frame: 0 and 2 standing, 1 and 3 mid-step with the hem swung. */
export const SKIRT = {
  s: [
    g(`
    .zsssAAAsssS.
    .zsssAAEsssS.
    zzsssAAEsssSS
    zsssAAAAEsssS
    zsssAAAAEsssS
    zSSSSSSSSSSSS
    ...oo...oo...
    ...oo...oo...
  `),
    g(`
    .zsssAAAsssS.
    .zsssAAEsssS.
    zzsssAAEsssSS
    zsssAAAAEsssS
    zzssAAAAEssSS
    zSSSSSSSSSSSS
    ...no...oo...
    ...oo........
  `),
    g(`
    .zsssAAAsssS.
    .zsssAAEsssS.
    zzsssAAEsssSS
    zsssAAAAEsssS
    zsssAAAAEsssS
    zSSSSSSSSSSSS
    ...oo...oo...
    ...oo...oo...
  `),
    g(`
    .zsssAAAsssS.
    .zsssAAEsssS.
    zzsssAAEsssSS
    zsssAAAAEsssS
    zzssAAAAEssSS
    zSSSSSSSSSSSS
    ...oo...no...
    ........oo...
  `),
  ],
  w: [
    g(`
    ..zsssssS....
    ..zsssssS....
    ..zsssssSS...
    .zzssssssS...
    .zssssssSS...
    .zSSSSSSSSS..
    ...noo.oo....
    ...ooo.oo....
  `),
    g(`
    ..zsssssS....
    ..zsssssS....
    ..zsssssSS...
    .zzssssssSS..
    zzsssssssSSS.
    zSSSSSSSSSSS.
    .noo.....oo..
    .ooo.....oo..
  `),
    g(`
    ..zsssssS....
    ..zsssssS....
    ..zsssssSS...
    .zzssssssS...
    .zssssssSS...
    .zSSSSSSSSS..
    ...noo.oo....
    ...ooo.oo....
  `),
    g(`
    ..zsssssS....
    ..zsssssS....
    ..zsssssSS...
    .zzsssssssS..
    .zssssssssSS.
    .zSSSSSSSSSS.
    ..noo...oo...
    ..ooo...oo...
  `),
  ],
  n: [
    g(`
    .zsssssssssS.
    .zsssssssssS.
    zzsssssssssSS
    zssssssssssSS
    zssssssssssSS
    zSSSSSSSSSSSS
    ...oo...oo...
    ...oo...oo...
  `),
    g(`
    .zsssssssssS.
    .zsssssssssS.
    zzsssssssssSS
    zssssssssssSS
    zzssssssssSSS
    zSSSSSSSSSSSS
    ...oo...oo...
    ........oo...
  `),
    g(`
    .zsssssssssS.
    .zsssssssssS.
    zzsssssssssSS
    zssssssssssSS
    zssssssssssSS
    zSSSSSSSSSSSS
    ...oo...oo...
    ...oo...oo...
  `),
    g(`
    .zsssssssssS.
    .zsssssssssS.
    zzsssssssssSS
    zssssssssssSS
    zzssssssssSSS
    zSSSSSSSSSSSS
    ...oo...oo...
    ...oo........
  `),
  ],
};
