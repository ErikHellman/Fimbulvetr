import { grid } from '../lib/sprite';
import { UTG_PAL as P } from './palette';

/**
 * Útgarðr, drawn by hand at 16 px: the giants' floor, one great flag over a pair of tiles, and their
 * walls of huge blocks rimed with frost.
 */
const g = (text: string) => grid(P, text);

export const GIANT_FLOOR = [
  g(`
    aacccaaaaacaccac
    baaaaaafbabaafaa
    aafaaaabafaaaaaa
    aaaaaaaaaaaaaaab
    aaaaaaaaaaafaaab
    aaaaaaaaeeeaaafa
    bbaaeeeeaaaaaaab
    abaaaaaaaaaaaaaa
    aabaaaaaaabaaaaa
    abaaaaaaabaaaaba
    aaaaaaaaaaaaabaa
    aaaaaaaaaaafacaa
    aaaffaaaacaaaaaa
    aaaaaaaaaafaaaaa
    dddddcdddcdcccdc
    eeeeeeeeeeeeeeee
  `),
  g(`
    caaafaaaaaaabfde
    caaaabacaaaaaace
    aaaaaaacaaaaaace
    caaaaabaaeaaabde
    caaaaaaaaefaaade
    caaaaaabaefaaade
    ccaabaaaeaaaaade
    aabaaaaaeaaaaade
    aaacaaaaeaafaade
    aaaaafaaaeafaade
    aaaaaaaacaaaafde
    abaaaaaaaaaaaace
    aaaaaabaaaaaaade
    caaaafaaaaabaade
    cabaaaaaaaaaacce
    caaaaaaabaaaabce
  `),
];

export const GIANT_WALL = [
  g(`
    hhHHHhhhhhhhHhHh
    hzvvuxhzvvuvhvvv
    vvvvuxvvvvvvvvvv
    vvuvvxvvvvuuvvvz
    vvvvvxvvvvuvvuvv
    vvvvzxvuvuvvvzvv
    vvvvvxvuvvvzuuvv
    xxxxxxxxxxxxxxxx
    uufuufuufufuffuu
    vvuuvvvvuvvxfvvv
    vvvuuzuvvvuxvvvv
    uvzzvvzvuvvxvvvv
    zyyzzyyyyyyyyyyy
    yyyyyyyyyzyyyyyy
    yyyyyyyzyyyzzzyy
    yyzyyyyyyzyyyyyy
  `),
  g(`
    HhHhHhhHhhhHhhhH
    vhvhhvvvvvhxhvvh
    zvvvvvvvvvvxvvvv
    vvvvvzvuvvvxvvvv
    vuvuvuvvvvuxvvvv
    uvuvvvvvvvvxvvvv
    vvvvvvvuuvvxvvvv
    xxxxxxxxxxxxxxxx
    uuuufufuufufufuu
    vvvxfvvvuvvvvvvv
    vzvxvvvuvvvvvvvv
    vvvxvvvvvzvzzvvv
    yzyyyyyyyzyyyyyy
    yyyyyyyyyyyyyyzy
    yyyyyyzyyyzyyzyy
    yyzyyyzyyyyyyyyy
  `),
];
