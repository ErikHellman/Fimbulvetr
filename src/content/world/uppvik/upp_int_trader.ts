import type { ScreenDef } from '@core/world/screen';

export const uppIntTrader: ScreenDef = {
  id: 'upp_int_trader',
  region: 'myrkvidr',
  purpose: "Hrafnkell's trading house: a long counter; mead and horns.",
  indoor: true,
  things: [
    /** The counter: Hrafnkell sells across it by day; by night he is in the mead hall. */
    {
      k: 'use',
      at: { x: 17, y: 9 },
      w: 4,
      script: 'shop_hrafnkell',
      when: { k: 'phase', is: ['morning', 'day'] },
    },
    { k: 'door', at: { x: 19, y: 16 }, dir: 's', to: 'upp_square', arrive: { x: 8, y: 7 }, facing: 's' },
  ],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwwwwwwwwwwwwwwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwbfffffffffffwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwbfffffffffffwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwfffttttfffffwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwffffffffffffwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwffffffffffffwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwffffffffffffwXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXwffffffffffttwXXXXXXXXXXXXX',
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
