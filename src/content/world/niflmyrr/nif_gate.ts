import type { ScreenDef } from '@core/world/screen';

export const nifGate: ScreenDef = {
  id: 'nif_gate',
  region: 'niflmyrr',
  purpose:
    "Helgrind's gate: a wall of black stone across the north, and an old flagged road up to it. The Gjöll comes out from under the wall, black and fast, and runs away west. The way in opens with M6b.",
  things: [],
  /** Where Niflmýrr's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 30, y: 13 },
    { x: 8, y: 16 },
    { x: 26, y: 18 },
  ],
  map: [
    '########################################',
    '#######888888888888888888888888888######',
    '#######888888888888888888888888888######',
    '######88888888888888888888888888888#####',
    '######88888888888888888888888888888#####',
    'vvvvvvvv88888888888jjjj8888888888888####',
    'vvvvvvvvv888888888jjjjjj88888888888*####',
    'vvvvvvvvvv**6***jjjjjjjjjj****6*******##',
    'vvvvvvvvvv*******jjjjjjjj**************#',
    '#*************************************5#',
    '#******6****************6******555555**#',
    '#*6************************6***55555***#',
    '#********************************5*****#',
    '#***6*********jjjjjjjj*****************#',
    '***************jjjjjjjj**********6*****#',
    '***6***********jjjjjjjj****************#',
    '**********6****jjjjjjjj*******55*******#',
    '******************jjjj*******5555***6**#',
    '#****6*****6******jjjj********55*******#',
    '##****************jjjj****************##',
    '####**************jjjj******6********###',
    '##################jjjj##################',
  ],
};
