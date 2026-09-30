import type { ScreenDef } from '@core/world/screen';

export const mylFerry: ScreenDef = {
  id: 'myl_ferry',
  region: 'myrland',
  purpose:
    "Bárðr's landing and his ferry boat, in a channel the warm springs keep open all winter. He rows nobody toward the mountains before the pass opens.",
  things: [],
  /** Where Mýrland's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 8, y: 18 },
    { x: 30, y: 18 },
  ],
  map: [
    '~~~~~~~~~~~~~~ssssssssssssss~~~~~~~~~~~T',
    '~~~~~~~~~~~~~~ssssssssssssss~~~~~~~~~~~T',
    '~~~~~~~~~~~~~~ssssssssssssss~~~~~~~~~~~T',
    '~~~~~~~~~~~~~~ssssssJsssssss~~~~~~~~~~~B',
    '~~~~~~~~~~~~~~ssssssJsssssss~~~~~~~~~~~B',
    '~~~~~~~~~~~~~~ssssssJsAAAsss~~~~~~~~~~~T',
    '~~~~~~~~~~~~~~ssssssJsssssss~~~~~~~~~~~T',
    'nnyynynnyyyynnnnnnnn,nnnnnnnnynyynyynyyT',
    'nnnnnnnnnnnnnnnnnnnn,nnnnnnnnnnnnnnnnnnT',
    'T.................,,,..................B',
    'T.................,,,..................T',
    'T.................,,,..................T',
    'T.................,,,..................B',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    'T.................,,,""".........".....T',
    'B.........".......,,,."........."..."..T',
    'T...........".....,,,"...."....."......T',
    'T."...............,,,....."............B',
    'TTTBBTBTTBTTTTTT..,,,..TTTBTTTTBTTBTTBTB',
  ],
};
