import type { ScreenDef } from '@core/world/screen';

export const hauIntStyrr: ScreenDef = {
  id: 'hau_int_styrr',
  region: 'haugar',
  purpose:
    "Styrr's cottage: a hearth, a hard bed, a mail shirt on a peg and a sword he no longer carries. Rest and a place to save.",
  indoor: true,
  things: [
    { k: 'door', at: { x: 19, y: 15 }, dir: 's', to: 'hau_huscarl', arrive: { x: 24, y: 8 }, facing: 's' },
    /** Styrr's spare bed: rest, and the save slots. */
    { k: 'use', at: { x: 15, y: 7 }, h: 2, script: 'styrr_rest' },
  ],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwwwwwwwwwwwwXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwbfffffffffwXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwbfffffffffwXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwffffhhffffwXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwffffhhffffwXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwffffffffffwXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwffffffffffwXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXwfffffffttfwXXXXXXXXXXXXXX',
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
