import type { ShopDef } from '@core/story/shop';
import { DEMO_SHOP } from './dev/demo';
import type { ShopId } from './ids';

export const SHOP_DEFS: Readonly<Partial<Record<ShopId, ShopDef>>> = {
  dev_shop: DEMO_SHOP,
  sigrun: {
    id: 'sigrun',
    name: { en: 'Sigrún’s wares', sv: 'Sigrúns varor' },
    stock: [
      { item: 'lantern', price: 25 },
      { item: 'flatbread', price: 5 },
    ],
  },
  /** Mead, and a second horn to carry it in (Þórdís gives the first). */
  hrafnkell: {
    id: 'hrafnkell',
    name: { en: 'Hrafnkell’s trading house', sv: 'Hrafnkells handelshus' },
    stock: [
      { item: 'mead_red', price: 20 },
      { item: 'mead_green', price: 25 },
      { item: 'horn', price: 40, when: { k: 'not', c: { k: 'item', id: 'horn', gte: 2 } } },
    ],
  },
  ketill: {
    id: 'ketill',
    name: { en: 'Ketill’s anvil', sv: 'Ketills städ' },
    stock: [
      { weapon: 'uppvik_sword', price: 80 },
      { armor: 'byrnie', price: 100 },
    ],
  },
};
