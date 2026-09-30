import type { ScreenDef } from '@core/world/screen';

export const mylFisher: ScreenDef = {
  id: 'myl_fisher',
  region: 'myrland',
  purpose:
    "The lake shore: Kári the fisherman's hut (door) and his jetty over a cove the warm springs keep open, so it can be fished all year.",
  things: [
    { k: 'door', at: { x: 7, y: 12 }, dir: 'n', to: 'myl_int_fisher', arrive: { x: 19, y: 14 }, facing: 'n' },
    /** Fishing off the end of Kári's jetty, once he has lent his rod. */
    { k: 'use', at: { x: 20, y: 2 }, script: 'fish_jetty' },
  ],
  /** Where Mýrland's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 30, y: 18 },
    { x: 14, y: 18 },
  ],
  map: [
    '~~~~~~~~~~~~~~~~sssssssss~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~sssssssss~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~sssssssss~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~ssssJssss~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~ssssJssss~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~ssssJssss~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~ssssJssss~~~~~~~~~~~~~~~',
    'nnnynynynnnnyyynnnnn,nnnnnynnnnynynynynn',
    'nnnnnnnnnnnnnnnnnnnn,nnnnnnnnnnnnnnnnnnn',
    'T...RRRRRRR.........,..................T',
    'T...RRCRRRR.........,..................T',
    'T...RRRRRRR.........,..................T',
    'B...WW+DWWW.........,..................T',
    'T......,............,.........,,,,,,,,,,',
    'T.....,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    'T.....,,,,....."........".....,,,,,,,,,,',
    'B.....,,,,.........".........",,,,,,,,,,',
    'T.....,,,,.............."..."""........B',
    'T.....,,,,...".........................T',
    'B.....,,,,........."...."."............B',
    'B.....,,,,.............................T',
    'TBTBTB,,,,BTBBTTBTTTBTTTTBTBBBTTBTTTTTTT',
  ],
};
