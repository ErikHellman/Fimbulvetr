import type { DialogueDef } from '@core/story/dialogue';
import { evening, flag, not } from './util';

/** Arnbjörg, a pilgrim at the roots of the World Tree. */
export const ARNBJORG: DialogueDef = {
  entry: [
    { when: flag('st_stone1_lit'), node: 'lit' },
    { when: not(flag('n_arnbjorg_met')), node: 'meet' },
    { when: evening, node: 'night' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'I came to pray at the roots, as my mother did. Now cold breathes out of the cave, and the roots are rotting.',
        sv: 'Jag kom för att be vid rötterna, som min mor gjorde. Nu andas kylan ur grottan, och rötterna ruttnar.',
      },
      do: [{ k: 'set', flag: 'n_arnbjorg_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'Gyða sent you? Then the stones truly have gone dark. The first one sleeps down there, deep under the roots.',
        sv: 'Skickade Gyða dig? Då har stenarna verkligen slocknat. Den första sover där nere, djupt under rötterna.',
      },
    },
    day: {
      text: {
        en: 'Something down there does not want to be found. I hear it moving when the wind is still.',
        sv: 'Något där nere vill inte bli hittat. Jag hör det röra sig när vinden står still.',
      },
    },
    lit: {
      text: {
        en: 'The roots are warm again. I felt it, the moment the stone woke. Two more, you say? Then go, and I will pray for you here.',
        sv: 'Rötterna är varma igen. Jag kände det i samma stund som stenen vaknade. Två till, säger du? Gå då, så ber jag för dig här.',
      },
    },
    night: {
      text: {
        en: 'Listen. The roots whisper at night. They are saying the same word over and over. Winter.',
        sv: 'Lyssna. Rötterna viskar om natten. De säger samma ord om och om igen. Vinter.',
      },
    },
  },
};
