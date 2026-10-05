import type { ScreenDef } from '@core/world/screen';

export const mylFerry: ScreenDef = {
  id: 'myl_ferry',
  region: 'myrland',
  purpose:
    "Bárðr's landing and his ferry boat, in a channel the warm springs keep open all winter. He rows nobody toward the mountains before the pass opens. Once Oddr is home, his skiff lies at the water's edge at 11–13, 6 and rows to Sævatn's near landing while the lake is open.",
  things: [
    /** Bárðr's boat, beside the jetty: he rows Ask to Sævatn's far landing (M7a). */
    { k: 'use', at: { x: 21, y: 5 }, w: 4, h: 2, script: 'ferry_out' },
    /** Oddr's skiff, drawn up on the sand once he is home from Sökkva Hof (M7b). */
    {
      k: 'scenery',
      at: { x: 11, y: 6 },
      w: 3,
      h: 1,
      art: 'skiff',
      shown: { k: 'flag', id: 'st_freed_oddr' },
    },
    {
      k: 'use',
      at: { x: 11, y: 6 },
      w: 3,
      h: 1,
      script: 'oddr_skiff',
      when: { k: 'flag', id: 'st_freed_oddr' },
    },
  ],
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
