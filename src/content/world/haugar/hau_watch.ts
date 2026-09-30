import type { ScreenDef } from '@core/world/screen';

export const hauWatch: ScreenDef = {
  id: 'hau_watch',
  region: 'haugar',
  purpose:
    'A ruined watchtower on the far side of a mountain stream in its gorge. From the near bank Ask can only look (the way over comes with the bow, in M4b).',
  things: [],
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
