import type { ScreenDef } from '@core/world/screen';

export const mylSprings: ScreenDef = {
  id: 'myl_springs',
  region: 'myrland',
  purpose:
    'The warm springs, steaming in every season: why the channel along this shore never freezes. A pile of old rock in the north-east corner is cracked: a bomb opens the cave behind it, where the bomb bag lies.',
  things: [
    /** The bank by the warm spring, mud in spring: one of Ragna's lumps of amber (`q_amber`). */
    { k: 'use', at: { x: 11, y: 5 }, script: 'amber_mud' },
    { k: 'crack', id: 'myl_k_springs', at: { x: 35, y: 3 }, w: 2, h: 1, art: 'rock' },
    { k: 'door', at: { x: 35, y: 3 }, dir: 'n', to: 'myl_int_cave', arrive: { x: 19, y: 14 }, facing: 'n' },
    { k: 'door', at: { x: 36, y: 3 }, dir: 'n', to: 'myl_int_cave', arrive: { x: 20, y: 14 }, facing: 'n' },
  ],
  /** Where Mýrland's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 10, y: 11 },
    { x: 30, y: 11 },
    { x: 26, y: 19 },
  ],
  map: [
    'TBTBTTBTBTBBTTBBTTTTTBTBBBTTBTTTTBBBTTTT',
    'T.................................####.B',
    'T.............ssssssss............####.T',
    'B....ssssss...ssssssss............#VV#.T',
    'T....ssssss...ssssssss....sssssss......T',
    'T....ssssss...............sssssss......B',
    'T....ssssss...............sssssss......B',
    'T.........................sssssss......T',
    'B.............K.......K...sssssss.K....T',
    'B......K..........K....................T',
    'T.............K........................T',
    'T......................................T',
    'T......................................T',
    ',,,,,,,,,,,,,,,,,,,,,,.................T',
    ',,,,,,,,,,,,,,,,,,,,,,.....sssssss.....T',
    ',,,,,,,,,,,,,,,,,,,,,,.....sssssss.....T',
    ',,,,,,,,,,,,,,,,,,,,,,.....sssssss.....T',
    'T..ssssss.........,,,,.....sssssss.....T',
    'B..ssssss.."."....,,,,.................T',
    'T".ssssss"..".....,,,,.................T',
    'T"."."....."....".,,,,.................B',
    'TTBTBBBTBBTTBTTTTT,,,,BTTTTBBBBTTBBTTTTT',
  ],
};
