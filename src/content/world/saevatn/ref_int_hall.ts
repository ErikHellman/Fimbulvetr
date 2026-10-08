import type { ScreenDef } from '@core/world/screen';

export const refIntHall: ScreenDef = {
  id: 'ref_int_hall',
  region: 'saevatn',
  purpose:
    "The Refuge's longhouse on Holmr: a long hearth, beds at either end, Vala's and Hreggviðr's tables, Embla's war table and a shrine stone saved from the drowned hof.",
  indoor: true,
  things: [
    { k: 'door', at: { x: 18, y: 16 }, dir: 's', to: 'sae_holmr', arrive: { x: 18, y: 12 }, facing: 's' },
    /** Vala's brews and Hreggviðr's ore-trade, across their tables. */
    { k: 'use', at: { x: 13, y: 12 }, w: 2, script: 'shop_vala' },
    { k: 'use', at: { x: 25, y: 12 }, w: 2, script: 'shop_hreggvidr' },
    /** Embla's war table. */
    { k: 'use', at: { x: 21, y: 13 }, w: 2, script: 'war_table' },
    /** The Refuge's shrine: a rune-stone brought out of the drowned hof. */
    { k: 'use', at: { x: 24, y: 6 }, script: 'hof_pray' },
  ],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXwwwwwwwwwwwwwwwwwwwwXXXXXXXXXX',
    'XXXXXXXXXXwbffffffffffffYfffbwXXXXXXXXXX',
    'XXXXXXXXXXwbffffffffffffffffbwXXXXXXXXXX',
    'XXXXXXXXXXwffffffffffffffffffwXXXXXXXXXX',
    'XXXXXXXXXXwfffffffhhfffffffffwXXXXXXXXXX',
    'XXXXXXXXXXwfffffffhhfffffffffwXXXXXXXXXX',
    'XXXXXXXXXXwffffffffffffffffffwXXXXXXXXXX',
    'XXXXXXXXXXwffttffffffffffttffwXXXXXXXXXX',
    'XXXXXXXXXXwffffffffffttffffffwXXXXXXXXXX',
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
