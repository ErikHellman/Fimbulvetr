import type { ScreenDef } from '@core/world/screen';

export const mylMill: ScreenDef = {
  id: 'myl_mill',
  region: 'myrland',
  purpose:
    "The millpond and Sökkva Kvern, the drowned mill, its roof standing out of the water. A plank walk leads to its door and down into the dungeon. Þuríðr, the miller's widow, lives on the north bank.",
  things: [
    { k: 'door', at: { x: 31, y: 5 }, dir: 'n', to: 'myl_int_widow', arrive: { x: 19, y: 14 }, facing: 'n' },
    /** The mill door at the end of the plank walk: down into Sökkva Kvern. */
    { k: 'door', at: { x: 18, y: 14 }, dir: 'n', to: 'd2_r01', arrive: { x: 19, y: 18 }, facing: 'n' },
    { k: 'door', at: { x: 19, y: 14 }, dir: 'n', to: 'd2_r01', arrive: { x: 20, y: 18 }, facing: 'n' },
  ],
  /** Where Mýrland's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 14, y: 3 },
    { x: 24, y: 19 },
  ],
  map: [
    'BBTBBT,,,,TTTBTBBBBTTTTBTTTTTBTTTBTBTTTT',
    'T.....,,,,.........".."................T',
    'T"....,,,,....."............RRRRRRR....T',
    'T....",,,,..."...."...."....RRCRRRR....T',
    'T.....,,,,..................RRRRRRR....T',
    'B.....,,,,..."......."......WW+D+WW....T',
    'T.....,,,,.....................,.......B',
    'B.....,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    'T.......,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    'BTTTTByyy~y~~y~~~~~~~~~yy~yyy~~~~~~~....',
    'TBTBTT~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~....',
    'TTTBBB~~~~~~~~~~~ZZZZ~~~~~~~~~~~~~~~~~~~',
    'TTBTBT~~~~~~~~~~~ZZZZ~~~~~~~~~~~~~~~~~~~',
    'BTTTTT~~~~~~~~~~~ZZZZ~~~~~~~~~~~~~~~~~~~',
    'BBTTTT~~~~~~~~~~~~JJ~~~~~~~~~~~~~~~~~~~~',
    'TTBBTB~~~~~~~~~~~~JJ~~~~~~~~~~~~~~~~~~~~',
    'TTTBBB~~~~~~~~~~~~JJ~~~~~~~~~~~~~~~~....',
    'TTBBTT~y~~~~~~~~~~,,y~y~yy~yy~~~y~~~....',
    'B.......,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    'B.......,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    'B.........,,,,..........................',
    'BTBBTBTBTT,,,,TTTBTBTBTTTBBBBBTBBTTTTTTT',
  ],
};
