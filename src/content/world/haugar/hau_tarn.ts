import type { ScreenDef } from '@core/world/screen';

export const hauTarn: ScreenDef = {
  id: 'hau_tarn',
  region: 'haugar',
  purpose:
    'A black tarn under the ridge. A piece of heart lies on the rock in its middle, in reach of the boomerang from the jetty (or on foot over winter ice).',
  things: [{ k: 'piece', id: 'hp_hau_tarn', at: { x: 18, y: 13 } }],
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
    '#EEEEEEEEE~~~~~~~~~~~~~~~~~yEEEEE,EEEEE#',
    '#EEEEEEEEy~~~~~~~~~~~~~~~~~~EEEEE,EEEEE#',
    '#EEEEEEE~~~~~~~~~~~~~~~~~~~~~EEEE,EEEEE#',
    '#EEETEEE~~~~~~~~~~~~~~~~~~~~~EEEE,EETEE#',
    '#EEEEEE~~~~~~~~~~~n~~~~~~~~~~~EEE,EEEEE#',
    '#EEEEEEE~~~~~~~~~~~~~~~~~~~~~EEEE,EEEEE#',
    '#EEEEEEE~~~~~~~~~~~~~~~~~~~~~yEEE,EEEEE#',
    '#EEEEEEEy~~~~~~~~~~~~~~~~~~~EEEEE,EEEEE#',
    '#EEEEEEEEE~~~~~~~~J~~~~~~~~EEEEEE,EEEEE#',
    '#EEEETEEEEEE~~~~~~J~~~~~~EEEEEEEE,EEEEE#',
    '#EEEEEEEEEEEEEEEEEJEEEEEEEEEEEEEE,EEEEE#',
    '#EEEEEEEEE,,,,,,,,,,,,,,,,,,,,,,,,EEEEE#',
    '########################################',
  ],
};
