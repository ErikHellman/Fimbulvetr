import type { ScreenDef } from '@core/world/screen';

export const testInt: ScreenDef = {
  id: 'test_int',
  region: 'askdalr',
  purpose:
    'Dev-only interior off the world grid: tests doors, fades and pocket origins; the bed sleeps to morning and the table is a stall.',
  indoor: true,
  things: [
    { k: 'door', at: { x: 19, y: 20 }, dir: 's', to: 'test_b', arrive: { x: 26, y: 14 }, facing: 's' },
    { k: 'use', at: { x: 13, y: 7 }, script: 'dev_script' },
    { k: 'use', at: { x: 25, y: 7 }, script: 'dev_shop' },
  ],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXwwwwwwwwwwwwwwwwwwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwfbffffffffffftffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwfffffffhffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwwwwwwwwDwwwwwwwwwXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ],
};
