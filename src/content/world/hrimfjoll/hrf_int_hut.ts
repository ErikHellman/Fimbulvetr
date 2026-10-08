import type { ScreenDef } from '@core/world/screen';

export const hrfIntHut: ScreenDef = {
  id: 'hrf_int_hut',
  region: 'hrimfjoll',
  purpose:
    "Ormr's hut under the beacon: a hearth that never goes out, a cot, and a stair cut in the rock up to the beacon. Warm: the frost cannot reach in here.",
  indoor: true,
  things: [
    { k: 'door', at: { x: 19, y: 16 }, dir: 's', to: 'hrf_beacon', arrive: { x: 9, y: 7 }, facing: 's' },
  ],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXwwwwwwwwwwwwwwwwXXXXXXXXXXXX',
    'XXXXXXXXXXXXwffffffffffffffwXXXXXXXXXXXX',
    'XXXXXXXXXXXXwfhhfffffffbfffwXXXXXXXXXXXX',
    'XXXXXXXXXXXXwfhhfffffffbfffwXXXXXXXXXXXX',
    'XXXXXXXXXXXXwffffffffffffffwXXXXXXXXXXXX',
    'XXXXXXXXXXXXwffffffffffffffwXXXXXXXXXXXX',
    'XXXXXXXXXXXXwffffffffffffffwXXXXXXXXXXXX',
    'XXXXXXXXXXXXwfffffffttfffffwXXXXXXXXXXXX',
    'XXXXXXXXXXXXwffffffffffffffwXXXXXXXXXXXX',
    'XXXXXXXXXXXXwffffffffffffffwXXXXXXXXXXXX',
    'XXXXXXXXXXXXwffffffffffffffwXXXXXXXXXXXX',
    'XXXXXXXXXXXXwwwwwwwDwwwwwwwwXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ],
};
