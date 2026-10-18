/**
 * The villagers' parts on the same 13 px strips as Ask, as text grids rendered per person with that
 * person's palette (see `build.ts`). Women's bodies: a bodice (7 rows) and a skirt with feet (8 rows).
 * Men's bodies reuse Ask's torso and legs. Heads: Ask's short crop, a woman's head framed by hair, and the
 * overlays that make the other styles (long hair, braid, kerchief, bald, beard), the apron and the tail.
 */

export const HEAD_W_TEXT = {
  s: `
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
  `,
  w: `
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
    ...dghhggd...
    ...ddhhgd....
  `,
};

/** The braid, pasted after the bodice: over the right shoulder (s), down the back (w, n). */
export const BRAID_TEXT = {
  s: {
    raster: `
    hg.
    ghg
    hgh
    ghg
    hgh
    .gh
    .bb
    .g.
  `,
    dx: 1,
    dy: 10,
  },
  w: {
    raster: `
    hg
    gh
    hg
    gh
    hg
    bb
    g.
  `,
    dx: 9,
    dy: 11,
  },
  n: {
    raster: `
    ghg
    hgh
    ghg
    hgh
    ghg
    hgh
    .bb
    .g.
  `,
    dx: 5,
    dy: 10,
  },
};

/** Bodice with the arms down; the walk swings the hands a pixel. */
export const BODICE_TEXT = {
  s: [
    `
    ..vttttttuu..
    .vvtttttttuu.
    .vtttttttttu.
    .ftttttttttd.
    .fbbbbbbbbbd.
    ..vtttttttu..
    ..vtttttttu..
  `,
    `
    ..vttttttuu..
    .vvtttttttuu.
    .ftttttttttu.
    .ftttttttttd.
    .vbbbbbbbbbd.
    ..vtttttttu..
    ..vtttttttu..
  `,
    `
    ..vttttttuu..
    .vvtttttttuu.
    .vtttttttttd.
    .ftttttttttd.
    .fbbbbbbbbbu.
    ..vtttttttu..
    ..vtttttttu..
  `,
  ],
  w: [
    `
    ..vttttuu....
    .vvtttttuu...
    .vtttutttu...
    .vtttutttu...
    .vbbbubbbu...
    ..vttfttu....
    ..vtttttu....
  `,
    `
    ..vttttuu....
    .vvtttttuu...
    .vttutttuu...
    .vttuttttu...
    .vbbubbbbu...
    ..vftttttu...
    ..vtttttu....
  `,
    `
    ..vttttuu....
    .vvtttttuu...
    .vttttutttu..
    .vttttuttu...
    .vbbbbubbu...
    ..vtttfttu...
    ..vtttttu....
  `,
  ],
  n: [
    `
    ..vttttttuu..
    .vvtttttttuu.
    .dvtttttttud.
    .dvtttttttud.
    .dbbbbbbbbbd.
    ..vtttttttu..
    ..vtttttttu..
  `,
  ],
};

/** Skirt and feet per walk frame: 0 and 2 standing, 1 and 3 mid-step with the hem swung. */
export const SKIRT_TEXT = {
  s: [
    `
    .zsssssssssS.
    .zsssssSsssS.
    zzsssssSsssSS
    zsssssssSsssS
    zsssssssSsssS
    zSSSSSSSSSSSS
    ...oo...oo...
    ...oo...oo...
  `,
    `
    .zsssssssssS.
    .zsssssSsssS.
    zzsssssSsssSS
    zsssssssSsssS
    zzssssssSssSS
    zSSSSSSSSSSSS
    ...no...oo...
    ...oo........
  `,
    `
    .zsssssssssS.
    .zsssssSsssS.
    zzsssssSsssSS
    zsssssssSsssS
    zsssssssSsssS
    zSSSSSSSSSSSS
    ...oo...oo...
    ...oo...oo...
  `,
    `
    .zsssssssssS.
    .zsssssSsssS.
    zzsssssSsssSS
    zsssssssSsssS
    zzssssssSssSS
    zSSSSSSSSSSSS
    ...oo...no...
    ........oo...
  `,
  ],
  w: [
    `
    ..zsssssS....
    ..zsssssS....
    ..zsssssSS...
    .zzssssssS...
    .zssssssSS...
    .zSSSSSSSSS..
    ...noo.oo....
    ...ooo.oo....
  `,
    `
    ..zsssssS....
    ..zsssssS....
    ..zsssssSS...
    .zzssssssSS..
    zzsssssssSSS.
    zSSSSSSSSSSS.
    .noo.....oo..
    .ooo.....oo..
  `,
    `
    ..zsssssS....
    ..zsssssS....
    ..zsssssSS...
    .zzssssssS...
    .zssssssSS...
    .zSSSSSSSSS..
    ...noo.oo....
    ...ooo.oo....
  `,
    `
    ..zsssssS....
    ..zsssssS....
    ..zsssssSS...
    .zzsssssssS..
    .zssssssssSS.
    .zSSSSSSSSSS.
    ..noo...oo...
    ..ooo...oo...
  `,
  ],
  n: [
    `
    .zsssssssssS.
    .zsssssssssS.
    zzsssssssssSS
    zssssssssssSS
    zssssssssssSS
    zSSSSSSSSSSSS
    ...oo...oo...
    ...oo...oo...
  `,
    `
    .zsssssssssS.
    .zsssssssssS.
    zzsssssssssSS
    zssssssssssSS
    zzssssssssSSS
    zSSSSSSSSSSSS
    ...oo...oo...
    ........oo...
  `,
    `
    .zsssssssssS.
    .zsssssssssS.
    zzsssssssssSS
    zssssssssssSS
    zssssssssssSS
    zSSSSSSSSSSSS
    ...oo...oo...
    ...oo...oo...
  `,
    `
    .zsssssssssS.
    .zsssssssssS.
    zzsssssssssSS
    zssssssssssSS
    zzssssssssSSS
    zSSSSSSSSSSSS
    ...oo...oo...
    ...oo........
  `,
  ],
};

/** Long hair falling past the shoulders: both sides (s), the back (w), a full fall (n). Pasted at the head's row 8. */
export const LONG_TEXT = {
  s: `
    hh.........gg
    hh.........gg
    hh.........gg
    hh.........gg
    hh.........gg
    hh.........gg
    gh.........gg
    .g.........g.
  `,
  w: `
    .........hhgg
    ........hhhgg
    ........hhhgg
    ........hhhgg
    ........hhhgg
    .........hhgg
    .........hgg.
    ..........g..
  `,
  n: `
    ..hhhhhhhhgg.
    ..hhhhhhhhgg.
    ..hhhhhhhhgg.
    ..hhhhhhhhgg.
    ..hhhhhhhhgg.
    ...hhhhhhgg..
    ....hhhhgg...
    .....gggg....
  `,
};

/** A beard under the mouth: full (s) and seen from the side (w). Pasted at the head's row 8. */
export const BEARD_TEXT = {
  s: `
    .mmmmmmmM.
    .mmmmmmmM.
    ..mmmmmMM.
    ...mmmMM..
    ....mMM...
  `,
  w: `
    mmmmmM
    mmmmMM
    .mmmMM
    ..mMM.
    ...M..
  `,
};

/** The apron panel from the belt down, south only. */
export const APRON_TEXT = `
    AAAAAAAE
    AAAAAAAE
    AAAAAAAE
    AAAAAAAE
    AAAAAAAE
    AAAAAAAE
    AAAAAAAE
    AAAAAAAE
    EEEEEEEE
`;

/** The huldra's cow tail from under the hem: down the back (n) and swinging out behind (w). */
export const TAIL_TEXT = {
  n: `
    .TT.
    .TT.
    .TQ.
    .TQ.
    .TQ.
    QQQQ
    QQQQ
  `,
  w: `
    TT..
    .TT.
    ..T.
    ..T.
    ..TQ
    .QQQ
    .QQQ
  `,
};
