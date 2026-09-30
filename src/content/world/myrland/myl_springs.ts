import type { ScreenDef } from '@core/world/screen';

export const mylSprings: ScreenDef = {
  id: 'myl_springs',
  region: 'myrland',
  purpose:
    'The warm springs, steaming in every season: why the channel along this shore never freezes. A pile of old rock in the north-east corner (a cave behind it, M3b).',
  things: [],
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
    'B....ssssss...ssssssss............####.T',
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
