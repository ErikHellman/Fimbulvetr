import type { ScreenDef } from '@core/world/screen';

export const askIntHof: ScreenDef = {
  id: 'ask_int_hof',
  region: 'askdalr',
  purpose: "Inside Gyða's hof: the rune-record stone (pray: rest and save) and two fires.",
  indoor: true,
  things: [
    { k: 'door', at: { x: 20, y: 18 }, dir: 's', to: 'ask_hof', arrive: { x: 20, y: 8 }, facing: 's' },
    /** The rune-record stone: pray to rest and save. */
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
