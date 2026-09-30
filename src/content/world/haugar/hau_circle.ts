import type { ScreenDef } from '@core/world/screen';

export const hauCircle: ScreenDef = {
  id: 'hau_circle',
  region: 'haugar',
  purpose: "The stone circle, the crossroads of Haugar. Haugar's warp stone stands at its heart.",
  things: [{ k: 'warp', region: 'haugar', at: { x: 20, y: 8 }, arrive: { x: 20, y: 9 } }],
  /** Where Haugar's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 6, y: 5 },
    { x: 33, y: 4 },
    { x: 6, y: 17 },
    { x: 34, y: 17 },
  ],
  map: [
    '##################,,,,##################',
    '#EEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEEEE#',
    '#EEEiEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEEME,,,,EMEEEEEEEEEEEiEEE#',
    '#EEEEEEEEEEEEMEEEjjjjjjEEEMEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEjjjjjjjjjjEEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEjjjjjjjjjjjjEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEjjjjjjjjjjjjjjEEEEEEEEEEEE#',
    ',,,,,,,,,,,,,jjjjjjjjjjjjjj,,,,,,,,,,,,,',
    ',,,,,,,,,,,,,jjjjjjjjjjjjjj,,,,,,,,,,,,,',
    ',,,,,,,,,,,,,jjjjjjjjjjjjjj,,,,,,,,,,,,,',
    '#EEEEEEEEEEEEjjjjjjjjjjjjjjEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEjjjjjjjjjjjjEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEjjjjjjjjjjEEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEMEEEjjjjjjEEEMEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEEME,,,,EMEEEEEEEEEiEEEEE#',
    '#EEEEEiEEEEEEEEEEE,,,,EEEEEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEEEE#',
    '##################,,,,##################',
  ],
};
