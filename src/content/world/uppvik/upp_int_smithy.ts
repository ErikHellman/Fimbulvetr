import type { ScreenDef } from '@core/world/screen';

export const uppIntSmithy: ScreenDef = {
  id: 'upp_int_smithy',
  region: 'myrkvidr',
  purpose: "Inside Ketill's smithy: the forge and a second anvil.",
  indoor: true,
  things: [
    /** The anvil indoors: Ketill's shop on a wet day. */
    {
      k: 'use',
      at: { x: 21, y: 10 },
      script: 'shop_ketill',
      when: {
        k: 'all',
        of: [
          { k: 'phase', is: ['morning', 'day'] },
          { k: 'weather', is: ['rain', 'storm'] },
        ],
      },
    },
    { k: 'door', at: { x: 19, y: 16 }, dir: 's', to: 'upp_smiths', arrive: { x: 9, y: 7 }, facing: 's' },
  ],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwwwwwwwwwwwwwwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwffffffffffffwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwfhhfffffffffwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwfhhfffffffffwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwfffffffaffffwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwffffffffffffwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwffffffffffffwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwfffffffffttfwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwffffffffffffwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwffffffffffffwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwwwwwwDwwwwwwwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ],
};
