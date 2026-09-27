import type { DialogueDef } from '@core/story/dialogue';
import { evening, flag, not } from './util';

/** Arnbjörg, a pilgrim at the roots of the World Tree. */
export const ARNBJORG: DialogueDef = {
  entry: [
    { when: not(flag('n_arnbjorg_met')), node: 'meet' },
    { when: evening, node: 'night' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'I came to pray at the roots, as my mother did. Now the cave is barred with logs, and the roots are rotting.',
        sv: 'Jag kom för att be vid rötterna, som min mor gjorde. Nu är grottan bommad med stockar, och rötterna ruttnar.',
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
        en: 'Someone piled those logs across the mouth from inside. Something down there does not want to be found.',
        sv: 'Någon staplade stockarna över öppningen inifrån. Något där nere vill inte bli hittat.',
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
