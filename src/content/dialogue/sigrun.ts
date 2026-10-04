import type { DialogueDef } from '@core/story/dialogue';
import { afterRaid, flag, raidNight } from './util';

/** Sigrún the trader, across her counter. The shop opens after she has spoken. */
export const SIGRUN: DialogueDef = {
  entry: [
    { when: raidNight, node: 'raid' },
    { when: flag('st_pass_open'), node: 'fimbul' },
    { when: afterRaid, node: 'after' },
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
    after: {
      text: {
        en: 'They took Bjarni. They took the children. I kept the shop open; I did not know what else to do.',
        sv: 'De tog Bjarni. De tog barnen. Jag höll butiken öppen, jag visste inte vad annat jag skulle göra.',
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
    fimbul: {
      text: {
        en: 'Nobody comes up the road in this. I sell what I have, and when it is gone, it is gone.',
        sv: 'Ingen kommer uppför vägen i det här. Jag säljer det jag har, och när det är slut är det slut.',
      },
    },
  },
};
