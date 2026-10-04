import type { ScreenDef } from '@core/world/screen';

export const mylReeds: ScreenDef = {
  id: 'myl_reeds',
  region: 'myrland',
  purpose:
    "Auðr's reed beds and the reed lake. A piece of heart waits on an islet too far out for the boomerang: it can only be walked to over the winter ice.",
  things: [
    { k: 'piece', id: 'hp_myl_reeds', at: { x: 29, y: 12 } },
    /** Where Auðr has cut the reeds: one of Ragna's lumps of amber (`q_amber`). */
    { k: 'use', at: { x: 8, y: 6 }, script: 'amber_reeds' },
  ],
  /** Where Mýrland's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 5, y: 15 },
    { x: 12, y: 17 },
  ],
  map: [
    'TTTBTTTBTTBTTBTTTB,,,,TTTTBTTTTBBBTTTTTT',
    'T.................,,,,.................B',
    'T.yyyyyyyyyyyyyy..,,,,.................T',
    'B.yy...yyyyyyyyy..,,,,.................B',
    'T.yyyyyyy....yyy..,,~~~~~~~~~~~~~~~~~..B',
    'T.yyyyyyyyyyyyyy..,,~~~~~~~~~~~~~~~~~..T',
    'T.yyyyyyyyyyyyyy..,,~~~~~~~~~~~~~~~~~..T',
    'T.................,,~~~~~~~~~~~~~~~~~..B',
    ',,,,,,,,,,,,,,,,,,,,~~~~~~~~~~~~~~~~~..T',
    ',,,,,,,,,,,,,,,,,,,,~~~~~~~~~~~~~~~~~..T',
    ',,,,,,,,,,,,,,,,,,,,~~~~~~~y~~yy~~~~~..T',
    ',,,,,,,,,,,,,,,,,,,,~~~~~~~~...~~~~~~..B',
    'T...................~~~~~~~y...~~~~~~..B',
    'B....."........"....~~~~~~~~...~~~~~~..T',
    'T........".."...."..~~~~~~~y~~~y~~~~~..T',
    'T......""......."...~~~~~~~~~~~~~~~~~..B',
    'B...........".......~~~~~~~~~~~~~~~~~..T',
    'B......"......."....~~~~~~~~~~~~~~~~~..B',
    'T."....."......."...~~~~~~~~~~~~~~~~~..B',
    'T...................~~~~~~~~~~~~~~~~~..T',
    'TTTTBTTTBTTTTTBTTTTBTTTTTTTBTTTBBTBBBTTT',
    'TTTTTTTTTTBBTTTTTTTTTTTTBTTTTBTBTTBTBBBB',
  ],
};
