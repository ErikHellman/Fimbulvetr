import type { ScreenDef } from '@core/world/screen';

export const refIntHall: ScreenDef = {
  id: 'ref_int_hall',
  region: 'saevatn',
  purpose:
    "The Refuge's longhouse on Holmr: a long hearth, sleeping benches along the walls, and a table spread with a map of the north.",
  indoor: true,
  things: [
    { k: 'door', at: { x: 18, y: 16 }, dir: 's', to: 'sae_holmr', arrive: { x: 18, y: 12 }, facing: 's' },
  ],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXwwwwwwwwwwwwwwwwwwwwXXXXXXXXXX',
    'XXXXXXXXXXwbffffffffffffffffbwXXXXXXXXXX',
    'XXXXXXXXXXwbffffffffffffffffbwXXXXXXXXXX',
    'XXXXXXXXXXwffffffffffffffffffwXXXXXXXXXX',
    'XXXXXXXXXXwfffffffhhfffffffffwXXXXXXXXXX',
    'XXXXXXXXXXwfffffffhhfffffffffwXXXXXXXXXX',
    'XXXXXXXXXXwffffffffffffffffffwXXXXXXXXXX',
    'XXXXXXXXXXwffffffffffffttffffwXXXXXXXXXX',
    'XXXXXXXXXXwffffffffffffffffffwXXXXXXXXXX',
    'XXXXXXXXXXwffffffffffffffffffwXXXXXXXXXX',
    'XXXXXXXXXXwffffffffffffffffffwXXXXXXXXXX',
    'XXXXXXXXXXwwwwwwwwDwwwwwwwwwwwXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ],
};
