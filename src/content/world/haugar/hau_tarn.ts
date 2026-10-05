import type { ScreenDef } from '@core/world/screen';

export const hauTarn: ScreenDef = {
  id: 'hau_tarn',
  region: 'haugar',
  purpose:
    'A black tarn under the ridge. A piece of heart lies on the rock in its middle, in reach of the boomerang from the jetty (or on foot over winter ice). East, the moor runs out to the chasm before Dvergagröf (M8). A little cairn on the south shore hides a piece of heart for whoever follows Embla’s second letter.',
  things: [
    { k: 'piece', id: 'hp_hau_tarn', at: { x: 18, y: 13 } },
    /** The little cairn where Embla and Ask hid from Halvar: her second letter leads here (M8a). */
    { k: 'use', at: { x: 4, y: 17 }, script: 'letter2_cairn' },
  ],
  /** Where Haugar's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 5, y: 15 },
    { x: 36, y: 3 },
    { x: 27, y: 18 },
  ],
  map: [
    '##############################,,,,######',
    '#EEEEEEEEEEEEEEEEEEEEEEEEEEEEE,,,,EEEEE#',
    '#EEEEEEEEEEEEEEEEEEEEEEEEEEEEE,,,,EEEEE#',
    '#EEEEEEEEEEEEEEEEEEEEEEEEEEEEE,,,,EEEEE#',
    '#EEEEEEEEEEEEEEEEEEEEEEEEEEEEE,,,,EEEEE#',
    '#EEEEEEEEEEEEEEEEEEEEEEEEEEEEE,,,,EEEEE#',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,EEEEE#',
    ',,,,,,EEEEEEEEEEEE~EEEEEEEEEEEEEE,EEEEE#',
    ',,,,,,EEEEEE~~~~~~~~~~~~~EEEEEEEE,EEEEE#',
    '#EEEEEEEEE~~~~~~~~~~~~~~~~~yEEEEE,EEEEEE',
    '#EEEEEEEEy~~~~~~~~~~~~~~~~~~EEEEE,EEEEEE',
    '#EEEEEEE~~~~~~~~~~~~~~~~~~~~~EEEE,EEEEEE',
    '#EEETEEE~~~~~~~~~~~~~~~~~~~~~EEEE,EETEEE',
    '#EEEEEE~~~~~~~~~~~n~~~~~~~~~~~EEE,EEEEE#',
    '#EEEEEEE~~~~~~~~~~~~~~~~~~~~~EEEE,EEEEE#',
    '#EEEEEEE~~~~~~~~~~~~~~~~~~~~~yEEE,EEEEE#',
    '#EEEEEEEy~~~~~~~~~~~~~~~~~~~EEEEE,EEEEE#',
    '#EEEiEEEEE~~~~~~~~J~~~~~~~~EEEEEE,EEEEE#',
    '#EEEETEEEEEE~~~~~~J~~~~~~EEEEEEEE,EEEEE#',
    '#EEEEEEEEEEEEEEEEEJEEEEEEEEEEEEEE,EEEEE#',
    '#EEEEEEEEE,,,,,,,,,,,,,,,,,,,,,,,,EEEEE#',
    '########################################',
  ],
};
