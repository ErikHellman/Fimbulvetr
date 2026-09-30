import type { ScreenDef } from '@core/world/screen';

export const mylIntWidow: ScreenDef = {
  id: 'myl_int_widow',
  region: 'myrland',
  purpose:
    "Þuríðr's house by the millpond: a hearth, her bed, the miller's old tally sticks. She offers rest and a place to save.",
  indoor: true,
  things: [
    { k: 'door', at: { x: 19, y: 15 }, dir: 's', to: 'myl_mill', arrive: { x: 31, y: 6 }, facing: 's' },
    /** Þuríðr's spare bed: rest, and the save slots. */
    { k: 'use', at: { x: 15, y: 7 }, h: 2, script: 'widow_rest' },
  ],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwwwwwwwwwwwwXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwbfffffttffwXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwbffffffffffXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwffffhhffffwXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwffffhhffffwXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwffffffffffwXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwffffffffffwXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwttffffffffwXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwffffffffffwXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwwwwwDwwwwwwXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ],
};
