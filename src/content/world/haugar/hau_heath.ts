import type { ScreenDef } from '@core/world/screen';

export const hauHeath: ScreenDef = {
  id: 'hau_heath',
  region: 'haugar',
  purpose:
    "Heather moor above Uppvík's bay (its west edge is the bay's far shore, with rapids along it). Hildr grazes her sheep here; the roads run north to the cairns, east to the stone circle and south to the barrows.",
  things: [
    { k: 'critter', id: 'sheep', at: { x: 14, y: 5 } },
    { k: 'critter', id: 'sheep', at: { x: 16, y: 7 } },
    { k: 'critter', id: 'sheep', at: { x: 12, y: 7 } },
  ],
  /** Where Haugar's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 30, y: 6 },
    { x: 15, y: 16 },
    { x: 32, y: 17 },
    { x: 6, y: 7 },
  ],
  map: [
    '~v##################,,,,################',
    '~vnEEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEE#',
    '~vnEEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEE#',
    '~vnEEEEEEEEEEEETEEEE,,,,EEEEEEEEEETEEEE#',
    '~vnEEEEEEEEEEEEEEEEE,,,,EEEEEEiEEEEEEEE#',
    '~vnEEEKEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEE#',
    '~vnEEEEEEEEEEEEEEEEE,,,,EEEKEEEEEEEEEEE#',
    '~vnEEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEKEEE#',
    '~vnEEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEE#',
    '~vnEEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEE#',
    '~vnEEEEE,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '~vnEEEEE,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '~vnEEEEE,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '~vnEEEEE,,,,EEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '~vnEEEEE,,,,EEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '~vnEEEEE,,,,EEEEEEEEEEEEEEEEEEEEEEEETEE#',
    '~vnEEiEE,,,,EEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '~vnEEEEE,,,,EKEEEEEEEEEEEEEEEEEEEiEEEEE#',
    '~vnEEEEE,,,,EEEEEEEEEEEEEEiEEEEEEEEEEEE#',
    '~vnEEEEE,,,,EEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '~vnEEEEE,,,,EEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '~v######,,,,############################',
  ],
};
