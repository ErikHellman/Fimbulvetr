import type { ScreenDef } from '@core/world/screen';

export const hauCairns: ScreenDef = {
  id: 'hau_cairns',
  region: 'haugar',
  purpose:
    'Cairns along a ridge, and one great sealed cairn of an old chieftain. An eye carved beside its door opens it to an arrow: inside lies a larger quiver.',
  things: [
    /** The great cairn's door: a slab that an eye carved beside it opens, for an arrow. */
    {
      k: 'gate',
      at: { x: 10, y: 10 },
      w: 1,
      h: 1,
      art: 'slab',
      closed: { k: 'not', c: { k: 'flag', id: 'w_hau_cairn' } },
    },
    { k: 'switch', at: { x: 8, y: 10 }, set: 'w_hau_cairn', eye: true },
    { k: 'door', at: { x: 10, y: 10 }, dir: 'n', to: 'hau_int_cairn', arrive: { x: 19, y: 14 }, facing: 'n' },
  ],
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
    '#EEEEEE###j###EEEEEEEEEEEEEEEEEEEEEEEEE#',
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
    '####################,,,,################',
  ],
};
