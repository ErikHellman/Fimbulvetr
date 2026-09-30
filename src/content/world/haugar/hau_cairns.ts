import type { ScreenDef } from '@core/world/screen';

export const hauCairns: ScreenDef = {
  id: 'hau_cairns',
  region: 'haugar',
  purpose:
    'Cairns along a ridge, and one great sealed cairn of an old chieftain. Its door opens in M4b, through an eye carved above it.',
  things: [],
  /** Where Haugar's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 8, y: 16 },
    { x: 30, y: 11 },
    { x: 15, y: 3 },
    { x: 34, y: 3 },
  ],
  map: [
    '########################################',
    '#EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '#EEEEEE#######EEEEEEEEEEEEEEEEEEEEEEEEE#',
    '#EEEEE#########EEEiEEiEEiEEiEEiEEiEEiEE#',
    '#EEEE###########EEEEEEEEEEEEEEEEEEEEEEE#',
    '#EEEE###########EEEEEEEEEEEEEEEEEEEEEEE#',
    '#EEEE###########EE$$$$$$$$EE$$$$$$$$EEE#',
    '#EEEEE#########EEEEEEEEEEEEEEEEEEEEEEEE#',
    '#EEEEEE#######EEEEEEEEEEEEEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEEEEEE,,,,EEEEEEEiEEEEEEE#',
    '#EEEEEEEEEEEEEEKEEEE,,,,EEEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEE#',
    '#EEEiEEEEEEEEEEEEEEE,,,,,,,,,,,,,,,,,,,,',
    '#EEEEEEEEEEEEEEEEEEE,,,,,,,,,,,,,,,,,,,,',
    '#EEEEEEEEEEEEiEEEEEE,,,,,,,,,,,,,,,,,,,,',
    '#EEEEEEEEEEEEEEEEEEE,,,,EEEEKEEEEEEEEEE#',
    '#EEEEEiEEEEEEEEEEEEE,,,,EEEEEEEEEEEiEEE#',
    '#EEEEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEE#',
    '~###################,,,,################',
  ],
};
