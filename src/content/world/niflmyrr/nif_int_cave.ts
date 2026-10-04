import type { ScreenDef } from '@core/world/screen';

export const nifIntCave: ScreenDef = {
  id: 'nif_int_cave',
  region: 'niflmyrr',
  purpose:
    'A dry cave behind the rockfall at the wisp jars, where a marsh-dweller hid what they had before the dead came.',
  indoor: true,
  dark: true,
  things: [
    { k: 'door', at: { x: 19, y: 15 }, dir: 's', to: 'nif_jars', arrive: { x: 23, y: 13 }, facing: 's' },
    {
      k: 'chest',
      id: 'nif_c_cave',
      at: { x: 19, y: 8 },
      gives: {
        silver: 80,
        text: {
          en: 'A purse of old silver, wrapped in oilcloth: 80 pieces.',
          sv: 'En pung med gammalt silver, inlindad i vaxduk: 80 stycken.',
        },
      },
    },
    { k: 'prop', id: 'pot', at: { x: 14, y: 8 } },
    { k: 'prop', id: 'pot', at: { x: 25, y: 13 } },
  ],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXQQQQQQQQQQQQQQQQXXXXXXXXXXXX',
    'XXXXXXXXXXXXQccccccccccccccQXXXXXXXXXXXX',
    'XXXXXXXXXXXXQccccccccccccccQXXXXXXXXXXXX',
    'XXXXXXXXXXXXQccccccccccccccQXXXXXXXXXXXX',
    'XXXXXXXXXXXXQccccccccccccccQXXXXXXXXXXXX',
    'XXXXXXXXXXXXQccccccccccccccQXXXXXXXXXXXX',
    'XXXXXXXXXXXXQccccccccccccccQXXXXXXXXXXXX',
    'XXXXXXXXXXXXQccccccccccccccQXXXXXXXXXXXX',
    'XXXXXXXXXXXXQccccccccccccccQXXXXXXXXXXXX',
    'XXXXXXXXXXXXQQQQQQQVQQQQQQQQXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ],
};
