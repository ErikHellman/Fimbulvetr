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
      /** Embla's cheese, back on the shelf once the crates are home (`q_crates`). */
      { item: 'cheese', price: 8, when: { k: 'flag', id: 'q_crates_done' } },
    ],
  },
  /** Mead, a second horn to carry it in (Þórdís gives the first), and bombs once Ask carries them. */
  hrafnkell: {
    id: 'hrafnkell',
    name: { en: 'Hrafnkell’s trading house', sv: 'Hrafnkells handelshus' },
    stock: [
      { item: 'mead_red', price: 20 },
      { item: 'mead_green', price: 25 },
      { item: 'horn', price: 40, when: { k: 'not', c: { k: 'item', id: 'horn', gte: 2 } } },
      { item: 'bombs', n: 5, price: 20, when: { k: 'owns', id: 'bombs' } },
      { item: 'arrows', n: 10, price: 15, when: { k: 'owns', id: 'bow' } },
    ],
  },
  /** The völva's brews: blue mead once she has her fen-moss. */
  heidr: {
    id: 'heidr',
    name: { en: 'Heiðr’s brews', sv: 'Heiðrs brygder' },
    stock: [
      { item: 'mead_red', price: 20 },
      { item: 'mead_green', price: 25 },
      { item: 'mead_blue', price: 40, when: { k: 'flag', id: 'q_volva_done' } },
    ],
  },
  /** Geirmundr's honest pots, and arrows once Ask carries a bow. */
  geirmundr: {
    id: 'geirmundr',
    name: { en: 'Geirmundr’s camp', sv: 'Geirmundrs läger' },
    stock: [
      { item: 'mead_red', price: 25 },
      { item: 'arrows', n: 10, price: 15, when: { k: 'owns', id: 'bow' } },
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
