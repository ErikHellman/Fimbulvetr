import type { DialogueDef } from '@core/story/dialogue';
import { flag } from './util';

/** Vala the healer at the Refuge: she heals Ask for nothing once a day, and sells her brews at her table. */
export const VALA: DialogueDef = {
  entry: [{ when: flag('ev_vala_day'), node: 'tomorrow' }, { node: 'heal' }],
  nodes: {
    heal: {
      text: {
        en: 'Sit. Hold still. There: the lake water and a little of my green, and the cold goes out of the cuts. Come back tomorrow if you must, not before.',
        sv: 'Sitt. Håll still. Så: sjövatten och lite av mitt gröna, och kylan går ur såren. Kom tillbaka i morgon om du måste, inte förr.',
      },
      do: [
        { k: 'heal', n: 0 },
        { k: 'set', flag: 'ev_vala_day', value: true },
        { k: 'sfx', id: 'sfx_drink' },
      ],
    },
    tomorrow: {
      text: {
        en: 'I said tomorrow. If you want something now, my brews are on the table, and they cost silver.',
        sv: 'Jag sa i morgon. Vill du ha något nu står mina brygder på bordet, och de kostar silver.',
      },
    },
  },
};
