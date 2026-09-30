import type { ScreenDef } from '@core/world/screen';

export const hauBarrows: ScreenDef = {
  id: 'hau_barrows',
  region: 'haugar',
  purpose:
    "The barrow field: grave mounds where the dead climb out at night, a great grave-hill whose cracked flank hides a piece of heart, and Geirmundr's tent by the road.",
  things: [
    /** Geirmundr's tent: his wares by day. */
    {
      k: 'use',
      at: { x: 11, y: 16 },
      w: 3,
      h: 2,
      script: 'shop_geirmundr',
      when: { k: 'not', c: { k: 'phase', is: 'night' } },
    },
    /** The cracked flank of the eastern grave-hill: a bomb opens the hollow and its piece of heart. */
    { k: 'crack', id: 'hau_k_barrows', at: { x: 31, y: 8 }, w: 1, h: 1, art: 'rock' },
    { k: 'piece', id: 'hp_hau_barrows', at: { x: 31, y: 4 } },
    /** At night the barrow-wights climb out of their mounds. */
    { k: 'enemy', id: 'haugbui', at: { x: 13, y: 10 }, when: { k: 'phase', is: 'night' } },
    { k: 'enemy', id: 'haugbui', at: { x: 24, y: 9 }, when: { k: 'phase', is: 'night' } },
  ],
  /** Where Haugar's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 5, y: 5 },
    { x: 24, y: 4 },
    { x: 28, y: 18 },
    { x: 9, y: 19 },
  ],
  map: [
    '########,,,,############################',
    '#EEEEEEE,,,,EEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '#EEEEEEE,,,,EEEEEEEEEEEEEEEEEENNNEEEEEE#',
    '#EEmEEiE,,,,EEEmEEEEEEEEEEENNNNNNNNNEEE#',
    '#EEEEEEE,,,,EEEEEEEEEEmEEENNNNjjjNNNNEE#',
    '#EEEEEEE,,,,EEEEEEEEEEEEEENNNNjjjNNNNEE#',
    '#EEEEEEE,,,,,,,,,,EEEEEEEENNNNNjNNNNNEE#',
    '#EEEENNEEEEEEEEE,,EEEEEEEEENNNNjNNNNEEE#',
    '#EENNNNNNEEEEEEE,,EEEEEEEEEEEENjNEEEEEE#',
    '#ENNNNNNNNEEEEEE,,EEEEEEmEEEEEE,EEEEEEE#',
    '#EENNNNNNEEEEmEE,,EEEEEEEEEEEEE,EEEEiEE#',
    '#EEEENNEEEEEEEEE,,EEEEEEEEEEEEE,EEEEEEE#',
    '#EiEEEEEEEEmEEEE,,EEEEEEEEmEEEE,EEEEEEE#',
    '#EEEEEEmEEEEEEEE,,EEEEEEEEEEEEE,EEEEEEE#',
    '#EEEEEEEEEEEEEEE,,EEEEEEEEEEEE,,,,,,,,,,',
    '#EEEEEEEEEEEEEEE,,,,,,,,,,,,,,,,,,,,,,,,',
    '#EEEmEEEEEE&&&EE,,EEEEEEEEEEEE,,,,,,,,,,',
    '#EEEEEEEEEE&&&EE,,,,,,EEEEEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEE,,,,,,EEEiEEEEEEEEEEEEE#',
    '#EEEEiEEEEEEEEEE,,,,,,EEEEEEEEiEEEEEEEE#',
    '#EEEEEEEEEEEEEEE,,,,,,EEEEEEEEEEEEEEEEE#',
    '##################,,,,##################',
  ],
};
