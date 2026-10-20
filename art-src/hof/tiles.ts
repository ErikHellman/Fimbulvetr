import { grid } from '../lib/sprite';
import { HOF_PAL as P } from './palette';

/**
 * Sökkva Hof, drawn by hand at 16 px: the drowned hof's green-grey flagstones at both levels, and the
 * sunken arches over the deep.
 */
const g = (text: string) => grid(P, text);

export const HOF_FLOOR = [
  g(`
    cccccccbcccccccb
    caaaaaabccaaaaab
    ceaaaacbcaaceaab
    caaaaaabcaaaaaab
    caaaaaabcaaaaaab
    caaaaaabcaeaeaab
    caaccaebcaaaaaeb
    bbbbbbbbbbbbbbbb
    ccccbcccccccbccc
    aeaabcaaaaaabcaa
    gaaabcaaaaaabcaa
    aaaabcaaagaabcaa
    eaaabcaaaaaabcaa
    aacabcaaaaaabcga
    aggebcaaaaaebcaa
    bbbbbbbbbbbbbbbb
  `),
  g(`
    ccbcccccccbccccc
    aebcgaacaabcaaaa
    cabcacaaaabcaaaa
    aabcagaagabcaaae
    aabcagaaaabcaaae
    aabcaagaaabcaaaa
    aebcaaaaaebcaaaa
    bbbbbbbbbbbbbbbb
    cccccccbcccccccb
    cceaaaabcaaacaab
    caaacaabcaaaaagb
    caaaaaabcaaacaab
    ccaaaaabcaaaaacb
    caaaaaabceaaaaab
    caeaaaebcacaaaeb
    bbbbbbbbbbbbbbbb
  `),
];

export const HOF_FLOOR_HI = [
  g(`
    CCCCCCCBCCCCCCCB
    CAAgAAEBCAAAAAAB
    CAAAAAABCAAAAAAB
    CACAAAABCAAAAAAB
    CAAAAAABCAAAAAAB
    CAACAACBCAAAAAAB
    CAAAAAEBCAAAAAEB
    BBBBBBBBBBBBBBBB
    CCCCBCCCCCCCBCCC
    AgAABCgEAAAABCAA
    AAAABCAgAAAABCAA
    AAAABCEAAAgABCCA
    AAAABCAgAACABCAA
    AAAABCAAAEAABCAg
    gAAEBCAAAAAEBCAA
    BBBBBBBBBBBBBBBB
  `),
  g(`
    CCBCCCCCCCBCCCCC
    gABCCAAAAABCAAAA
    AABCAAAAAABCAgAA
    AABCACAgAABCAAAA
    AABCAAAAAABCAAEE
    AEBCAAAAAABCAACA
    AEBCAEAAAEBCEAAg
    BBBBBBBBBBBBBBBB
    CCCCCCCBCCCCCCCB
    CAAEAAABCAAEAAAB
    CAAAAgABCAAAAAAB
    CAAAAAABCAECAAAB
    CCAECAABCAAAAAEB
    CAAAAAEBCAAAAAAB
    CAAAAAEBCAAAAAEB
    BBBBBBBBBBBBBBBB
  `),
];

export const ARCH = [
  g(`
    oOoooooOOOoooooo
    SSSSSqSSSSSqSSSS
    sssssqSssSsqsSss
    sssssqsssssqssss
    ssssssssssssssss
    qqqqqqqkkqqqqqqq
    ssqssqkkkkqssqss
    ssqsskkkkkkssqss
    ssqsskkkkkkssqss
    ssqsskkkkkkssqss
    kkkkkkkkkkkkkkkk
    kkkkkkkkkkkkkkkk
    okokooooookkoooo
    ooooooooooOOOooo
    oooOOOoooooooooo
    oooooooooOOooooo
  `),
];
