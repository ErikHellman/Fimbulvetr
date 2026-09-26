import type { ScriptDef } from '@core/story/script';
import type { ShopDef } from '@core/story/shop';

/**
 * Dev-only content for the test lands: a bed that sleeps to morning and a stall, so every M1a system
 * can be tried without the real world.
 */
export const DEMO_SCRIPTS: Readonly<Record<'dev_script' | 'dev_shop', ScriptDef>> = {
  dev_script: {
    steps: [
      { k: 'say', who: 'ask', text: { en: 'A nap would not hurt.', sv: 'En tupplur skadar inte.' } },
      { k: 'fade', out: true },
      {
        k: 'do',
        effects: [
          { k: 'sleep', until: 6 * 60 },
          { k: 'heal', n: 0 },
        ],
      },
      { k: 'card', text: { en: 'Morning.', sv: 'Morgon.' } },
      { k: 'fade', out: false },
    ],
  },
  dev_shop: {
    steps: [
      {
        k: 'say',
        who: null,
        text: { en: 'A stall with odds and ends.', sv: 'Ett stånd med lite av varje.' },
      },
      { k: 'shop', id: 'dev_shop' },
    ],
  },
};

export const DEMO_SHOP: ShopDef = {
  id: 'dev_shop',
  name: { en: 'Odds and ends', sv: 'Lite av varje' },
  stock: [
    { item: 'lantern', price: 30 },
    { item: 'flatbread', price: 4 },
  ],
};
