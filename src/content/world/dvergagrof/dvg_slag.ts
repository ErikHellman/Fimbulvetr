import type { ScreenDef } from '@core/world/screen';

export const dvgSlag: ScreenDef = {
  id: 'dvg_slag',
  region: 'dvergagrof',
  purpose:
    'The slag heaps: black spoil from a thousand years of digging. Two seams of black ore rock show in the heaps, and a bomb breaks each.',
  things: [
    /** A pool of slag that never cooled (M11a), with a dry eye in its middle: only Ís crusts a way in. */
    { k: 'piece', id: 'hp_dvg_slag', at: { x: 35, y: 17 } },

    /** Black ore rock in the heaps: a bomb breaks it, and ore lies behind. */
    { k: 'crack', id: 'dvg_k_ore1', at: { x: 19, y: 8 }, w: 1, h: 1, art: 'rock' },
    { k: 'chest', id: 'dvg_c_ore1', at: { x: 19, y: 7 }, gives: { item: 'ore', n: 3 } },
    { k: 'crack', id: 'dvg_k_ore2', at: { x: 28, y: 14 }, w: 1, h: 1, art: 'rock' },
    { k: 'chest', id: 'dvg_c_ore2', at: { x: 28, y: 15 }, gives: { item: 'ore', n: 3 } },
  ],
  /** Where Dvergagröf's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 8, y: 16 },
    { x: 34, y: 12 },
    { x: 24, y: 8 },
  ],
  map: [
    '########################################',
    '########################################',
    '########################################',
    '#······································#',
    '#················#####··········####···#',
    '#················#####··········####···#',
    '·················#####··········####···#',
    '·················##·##·················#',
    ',,,,,,,,,,,,·····##·##·················#',
    '···········,···························#',
    '#··········,····························',
    '#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '#··········,····························',
    '#···####···,····························',
    '#···####···,··············##·##········#',
    '#···####···,··············##·##··≈≈≈≈≈·#',
    '#··········,··············#####··≈≈≈≈≈·#',
    '#··········,··············#####··≈≈·≈≈·#',
    '#··········,·····················≈≈≈≈≈·#',
    '#··········,·····················≈≈≈≈≈·#',
    '#··········,···························#',
    '##########·,··##########################',
  ],
};
