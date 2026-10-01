import type { ScreenDef } from '@core/world/screen';

export const hauWatch: ScreenDef = {
  id: 'hau_watch',
  region: 'haugar',
  purpose:
    'A ruined watchtower on the far side of a mountain stream in its gorge. An eye carved on the far bank lowers the old bridge when an arrow opens it; a piece of heart lies in the tower.',
  things: [
    /** An eye on the far bank lowers the old bridge across the gorge. */
    { k: 'switch', at: { x: 25, y: 8 }, set: 'w_hau_watch', eye: true },
    { k: 'bridge', at: { x: 21, y: 14 }, w: 4, h: 2, down: { k: 'flag', id: 'w_hau_watch', eq: true } },
    { k: 'piece', id: 'hp_hau_watch', at: { x: 31, y: 6 } },
  ],
  /** Where Haugar's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 6, y: 7 },
    { x: 16, y: 16 },
  ],
  map: [
    '########################################',
    '#####################vvvv###############',
    '#####################vvvv###############',
    '##EEEEEEEEEEEEEEEEEEEvvvvEEEEEEEEEEEE###',
    '##EEEEEEEEEEKEEEEEEEEvvvvEEE$$$$$$$EE###',
    '##EEEiEEEEEEEEEEEEEEEvvvvEEE$jjjjj$EE###',
    '##EEEEEEEEEEEEEiEEEEEvvvvEEE$jjjjj$EE###',
    '##EEEEEEEEEEEEEEEEEEEvvvvEEE$jjjjj$EE###',
    '##EEEEEEEEEEEEEEEEEEEvvvvEEE$jjjjj$EE###',
    '##EEEEEEEEEEEEEEEEEEEvvvvEEE$$$j$$$EE###',
    '##EEEEKEEEEEEEEEEEEEEvvvvEEEEEEEEEEEE###',
    '##EEEEEEEEEEEEEEEEEEEvvvvEEEEEEEEEEEE###',
    '##EEEEEE,,,,EEEEEEEEEvvvvEEEEEEEEEEEE###',
    '##EEEEEE,,,,EEEEEEEEEvvvvEEEEEEEEEEEE###',
    '##EEiEEE,,,,EEEEEEEEEvvvvEEEEEEEEEEEE###',
    '##EEEEEE,,,,EEEEEEEEEvvvvEEEEEEEEEEEE###',
    '##EEEEEE,,,,EEEEEEEEEvvvvEEEEEEEEEEEE###',
    '##EEEEEE,,,,EEEEEiEEEvvvvEEEEEEEEEEEE###',
    '##EEEEEE,,,,EEEEEEEEEvvvv###############',
    '##EEEEEE,,,,EEEEEEEEEvvvv###############',
    '##EEEEEE,,,,EEEEEEEEEvvvv###############',
    '########,,,,############################',
  ],
};
