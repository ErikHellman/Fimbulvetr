import type { ScreenDef } from '@core/world/screen';

export const uppIntHof: ScreenDef = {
  id: 'upp_int_hof',
  region: 'myrkvidr',
  purpose: "Uppvík's hof: a rune-stone to pray at (rest and save) between two fires; Gunnhildr keeps it.",
  indoor: true,
  things: [
    { k: 'door', at: { x: 20, y: 18 }, dir: 's', to: 'upp_hall', arrive: { x: 8, y: 17 }, facing: 's' },
    /** The hof's rune-stone: pray to rest and save. */
    { k: 'use', at: { x: 20, y: 8 }, script: 'hof_pray' },
  ],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXwwwwwwwwwwwwwwwwwwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffMfffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffhhffffffffhhffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffhhffffffffhhffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwwwwwwwwwDwwwwwwwwXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ],
};
