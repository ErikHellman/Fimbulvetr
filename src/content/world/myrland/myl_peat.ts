import type { ScreenDef } from '@core/world/screen';

export const mylPeat: ScreenDef = {
  id: 'myl_peat',
  region: 'myrland',
  purpose:
    "Ljótr's peat cuttings: banks of cut turf between flooded trenches. Bog-lights drift over them at night. A bank of old rock in the north-east is cracked; a bomb opens the hollow where a piece of heart lies.",
  things: [
    { k: 'enemy', id: 'myrljos', at: { x: 16, y: 9 }, when: { k: 'phase', is: 'night' } },
    { k: 'crack', id: 'myl_k_peat', at: { x: 35, y: 4 }, w: 2, h: 1, art: 'rock' },
    { k: 'piece', id: 'hp_myl_peat', at: { x: 35, y: 3 } },
  ],
  /** Where Mýrland's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 8, y: 18 },
    { x: 25, y: 18 },
    { x: 20, y: 5 },
    { x: 36, y: 14 },
  ],
  map: [
    'BTBTBBTBTT,,,,TTBTBBBBTTTBBTBTTTTTTTTTBB',
    'T.........,,,,.........................T',
    'B.........,,,,....................####.T',
    'T.........,,,,....................#..#.T',
    'T...qqqqqq,,,,qqqqqqqqqqqqqqqqqqqq#..#.B',
    'T...qqqqqqqqqqqqqqqqqqqqqqqqqqqqqq.....T',
    'B...qqqqqqqqqqqqqqqqqqqqqqqqqqqqqq.....T',
    'B...qq~~~~~~~~~~~~qq~~~~~~~~~~~~qq.....T',
    'T...qqqqqqqqqqqqqqqqqqqqqqqqqqqqq,,,,,,,',
    'T...qqqqqqqqqqqqqqqqqqqqqqqqqqqqq,,,,,,,',
    'T...qqqqqqqqqqqqqqqqqqqqqqqqqqqqq,,,,,,,',
    'T...qq~~~~qq~~~~~~~~~~~~~~~~~~~~q,,,,,,,',
    'B...qqqqqqqqqqqqqqqqqqqqqqqqqqqqqq.....B',
    'T...qqqqqqqqqqqqqqqqqqqqqqqqqqqqqq.....T',
    'B...qqqqqqqqqqqqqqqqqqqqqqqqqqqqqq.....T',
    'T...qq~~~~~~~~~~~~~~~~~~qq~~~~~~qq.....T',
    'B...qqqqqqqqqqqqqqqqqqqqqqqqqqqqqq.....B',
    'B.........."...........".......".......T',
    'B"..............................."."...T',
    'T..................""."......".........T',
    'TBTBTTBTTBTTBTBTTTTBBBBTTTTTTBBBTTTTTBTB',
    'TBTTTTBTTBTTTBBTTBTTTTTTBBTBTTTBTTBTTTTB',
  ],
};
