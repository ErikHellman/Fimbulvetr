import type { DialogueDef } from '@core/story/dialogue';
import { afterRaid, atLeast, flag, raidNight } from './util';

/** Sigrún the trader, across her counter. The shop opens after she has spoken. */
export const SIGRUN: DialogueDef = {
  entry: [
    { when: raidNight, node: 'raid' },
    { when: flag('q_crates_done'), node: 'crates_after' },
    { when: atLeast('q_crates_home', 3), node: 'crates_won' },
    { when: flag('q_crates_asked'), node: 'crates_wait' },
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
      next: 'crates',
    },
    crates: {
      text: {
        en: 'And what I have is out in the snow. The storm on the raid night took three crates off my cart: one in the farmyard, one by the hof, one down by the brook. Carry them to my door?',
        sv: 'Och det jag har ligger ute i snön. Stormen på plundringsnatten tog tre lårar från min kärra: en på gårdsplanen, en vid hovet, en nere vid bäcken. Bär dem till min dörr?',
      },
      do: [{ k: 'set', flag: 'q_crates_asked', value: true }],
    },
    crates_wait: {
      text: {
        en: 'Three crates: the farmyard, the hof, the brook. Set them down by my door; I will not have them dragged through the shop.',
        sv: 'Tre lårar: gårdsplanen, hovet, bäcken. Ställ dem vid min dörr; jag vill inte ha dem släpade genom butiken.',
      },
    },
    crates_won: {
      text: {
        en: 'All three, and the seals unbroken! There is Embla’s cheese in this one; I can sell it again. And this was in the bottom of the last. It is yours.',
        sv: 'Alla tre, och sigillen obrutna! Det är Emblas ost i den här; jag kan sälja den igen. Och det här låg i botten av den sista. Den är din.',
      },
      do: [
        { k: 'piece', id: 'hp_ask_village' },
        { k: 'set', flag: 'q_crates_done', value: true },
      ],
    },
    crates_after: {
      text: {
        en: 'Embla’s cheese, while it lasts. She made it before… well. Before.',
        sv: 'Emblas ost, så länge den räcker. Hon gjorde den innan… ja. Innan.',
      },
    },
  },
};
