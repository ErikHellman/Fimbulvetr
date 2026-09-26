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
};
