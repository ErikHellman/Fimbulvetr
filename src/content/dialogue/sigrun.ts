import type { DialogueDef } from '@core/story/dialogue';
import { raid } from './util';

/** Sigrún the trader, across her counter. The shop opens after she has spoken. */
export const SIGRUN: DialogueDef = {
  entry: [
    { when: raid, node: 'raid' },
    { when: { k: 'item', id: 'lantern' }, node: 'regular' },
    { node: 'hello' },
  ],
  nodes: {
    hello: {
      text: {
        en: 'Welcome! Lanterns, bread and gossip. The gossip is free.',
        sv: 'Välkommen! Lyktor, bröd och skvaller. Skvallret är gratis.',
      },
      next: 'hello2',
    },
    hello2: {
      text: {
        en: 'A lantern would be wise. The nights are getting longer, whatever the calendar says.',
        sv: 'En lykta vore klokt. Nätterna blir längre, vad almanackan än säger.',
      },
    },
    regular: {
      text: {
        en: 'Back again? Keep that lantern trimmed.',
        sv: 'Tillbaka igen? Håll lyktan putsad.',
      },
    },
    raid: {
      text: { en: 'The shop is shut! Run!', sv: 'Boden är stängd! Spring!' },
    },
  },
};
