import { grid } from '../lib/sprite';
import { ASK_PAL as P } from './palette';

/**
 * Askdalr's houses: the plank walls, doorways, shut doors and windows of the house fronts, the chimney
 * stack on its turf roof, the ledge, the board floors and inner walls of the interiors, the jetty planks,
 * and the ground a tree stands on. One tile per variant; light from the top-left.
 */
const g = (text: string) => grid(P, text);

export const WALL = g(`
    kkkkkkkkkkkkkkkk
    kkkkkkkkkkkkkkkk
    OOOOOOOOOOOOOOOO
    OooqOooqOooqOooq
    OooqOooqOooqOooq
    OooqOooqOooqOqoq
    OooqOooqOooqOooq
    OooqOoqqOooqOooq
    OooqOoqqOooqOooq
    OooqOooqOooqOooq
    OooqOooqOooqOooq
    OooqOooqOooqOooq
    OooqOooqOooqOooq
    qqqqqqqqqqqqqqqq
    rrlrRrrrrlrrrrRr
    RrRRRRrRRRRrRRRR
`);

export const DOOR = g(`
    kkkkkkkkkkkkkkkk
    kkkkkkkkkkkkkkkk
    OOOOOOOOOOOOOOOO
    OoOkkkkkkkkkkqoq
    OoOkkkkkkkkkkqoq
    OoOkkkkkkkkkkqoq
    OoOkkkkkkkkkkqoq
    OoOkkkkkkkkkkqoq
    OoOkkkkkkkkkkqoq
    OoOkkkkkkkkkkqoq
    OoOkkkkkkkkkkqoq
    OoOkkkkkkkkkkqoq
    OoOkkkkkkkkkkqoq
    qqOkqqqqqqqqkqqq
    rrOkppppppppkqRr
    RrOkppppppppkqRR
`);

export const DOOR_SHUT = g(`
    kkkkkkkkkkkkkkkk
    kkkkkkkkkkkkkkkk
    OOkkkkkkkkkkkkOO
    OokOoqOoqOoqqkoq
    OokOoqOoqOoqqkoq
    OoksssOoqOoqqkoq
    Ookqqqqqqqqqqkoq
    OokOoqOoqOoqqkoq
    OokOoqOoqOoiqkoq
    OokOoqOoqOosqkoq
    OoksssOoqOoqqkoq
    Ookqqqqqqqqqqkoq
    OokOoqOoqOoqqkoq
    qqkOoqOoqOoqqkqq
    rrkOoqOoqOoqqkRr
    RrkOoqOoqOoqqkRR
`);

export const WINDOW = g(`
    kkkkkkkkkkkkkkkk
    kkkkkkkkkkkkkkkk
    OOOqqqqqqqqqqOOO
    Oookkkkkkkkkkooq
    OookRRRRoRRRkooq
    OookRllRoRRRkqoq
    OookRlRRoRRRkooq
    OookRRRRoRRRkooq
    Oookooooooookooq
    OookRRRRoRRRkooq
    OookRRRRoRrRkooq
    OookRRRRoRRRkooq
    Oookkkkkkkkkkooq
    qqqqqqqqqqqqqqqq
    rrlrRrrrrlrrrrRr
    RrRRRRrRRRRrRRRR
`);

export const CHIMNEY = g(`
    TTTTTTTTYTTTTTTT
    eeeTkkkkkkkkeTee
    TTTTklRRRRRkTTTT
    TTTTklrrrrRkTTTT
    TTTTkRrrRrRkTTTT
    eeeekrrrrrRkeeTe
    TTTTkrrrrrRkTTTT
    TTTTkRrrRrRkTTTT
    TTTTkrrrrrRkTTTT
    TeeekrrrrrRkeeeT
    TTTTkRrrRrRkTTTT
    TTTTkrrrrrRkTTTT
    YTTTktttttttTTTT
    eTeeeeeeeeeeeeee
    TTTTTTTTTTTTTTTT
    TTTTTTTTTTTTTTTT
`);

export const LEDGE = g(`
    GGGGGGGGGGGGGGGG
    GGGGGGGGGGGGGGGG
    GGGGGGGGGGGGGGGG
    GGGLGgGGGGGGGGGG
    GGGggGGGGGGGGGGG
    GGGGGGGGGGGGGGGG
    GGGGGGGGGGLGgGGG
    GGGGGGGGGGggGGGG
    GGGGGGGGGGGGGGGG
    gggggggggggggggg
    kkkkkkkkkkkkkkkk
    DDEDDDEDDdDDDDED
    DdDDDDDdDDEDDdDD
    DDDDEdDDDDDDEDDd
    DDDdDDDDDDDdDDDD
    dddddddddddddddd
`);

export const FLOOR = [
  g(`
    QQQQQQQQQQQQQQQQ
    PPPPPpPPPPPPPPPP
    PPPPPpPPPPPPPPPP
    pppppppppppppppp
    QQQQQQQQQQQQQQQQ
    PPQQQQPPPPPPPPPP
    PPPPPPPPPPPPPPPP
    pppppppppppppppp
    QQQQQQQQQQQQQQQQ
    PPPPPPPPPPPPpPPP
    PPPPPPPPPPPPPPPP
    pppppppppppppppp
    QQQQQQQQQQQQQQQQ
    PPPPPPPPPPPPPPPP
    PPPPPPPPPPPPPPPP
    pppppppppppppppp
  `),
  g(`
    QQQQQQQQQQQQQQQQ
    PPPPPPPPPQQQQPPP
    PPPPPPPPPPPPPPPP
    pppppppppppppppp
    QQQQQQQQQQQQQQQQ
    PPPPPPPPPPPPPPPP
    PPPPPPPPPPpPPPPP
    pppppppppppppppp
    QQQQQQQQQQQQQQQQ
    PPPPPPPPPPPPPPPP
    PPPPPPPPPPPPPPPP
    pppppppppppppppp
    QQQQQQQQQQQQQQQQ
    PPPpPPPPPPPPPPPP
    PPPPPPPPPPPPPPPP
    pppppppppppppppp
  `),
];

export const WALL_INT = g(`
    OOOOOOOOOOOOOOOO
    oooooooooooooooo
    oqqkoqqkoqqkoqqk
    oqqkoqqkoqqkoqqk
    oqqkoqqkoqqkoqqk
    oqqkoqqkoqqkoqqk
    oqqkoqqkokqkoqqk
    oqqkoqqkokqkoqqk
    oqqkoqqkoqqkoqqk
    oqqkoqqkoqqkoqqk
    oqqkoqqkoqqkoqqk
    oqqkoqqkoqqkoqqk
    kkkkkkkkkkkkkkkk
    pppppppppppppppp
    pppPpppPpppPpppP
    pppppppppppppppp
`);

export const JETTY = g(`
    qkkkkkkkkkkkkkkO
    qOOOOOOOOOOOOOOO
    qkkooooooooookkO
    qkkooooooooookkO
    qqqqqqqqqqqqqqqO
    qOOOOOOOOOOOOOOO
    qooooooqoooooooO
    qooooooqoooooooO
    qqqqqqqqqqqqqqqO
    qOOOOOOOOOOOOOOO
    qooooooooooooooO
    qooooooooooooooO
    qkkqqqqqqqqqqkkO
    qkkOOOOOOOOOOkkO
    qooooooooooooooO
    qkkkkkkkkkkkkkkO
`);

export const TREE_GROUND = g(`
    GGGGGGGGGGGGGGGG
    GGGGGGGGGGGGGGGG
    GGGGGGGGGGGGGGGG
    GGGLGgGGGGGGGGGG
    GGGggGGGGGGGGGGG
    GGGGGGGGGGGGGGGG
    GGGGGGGGGGLGgGGG
    GGGGGGGGGGggGGGG
    GGGggggggggggGGG
    GGggggggggggggGG
    GgggeggggggggggG
    GgggggLggggggggG
    GGgggggggggegLGg
    GGGgggggeggggggG
    GGGGGGGGGGGGGGGG
    GGGGGGGGGGGGGGGG
`);
