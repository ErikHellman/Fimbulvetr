import type { DialogueDef } from '@core/story/dialogue';
import { evening, flag, not } from './util';

/** Gunnhildr keeps Uppvík's hof. Its rune-stone steadies body and breath. */
export const GUNNHILDR: DialogueDef = {
  entry: [
    { when: not(flag('n_gunnhildr_met')), node: 'meet' },
    { when: evening, node: 'night' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Welcome to the gods’ house. I am Gunnhildr. Kneel at the stone and it will steady you, body and breath.',
        sv: 'Välkommen till gudarnas hus. Jag är Gunnhildr. Knäfall vid stenen så stärker den dig, kropp och ande.',
      },
      do: [{ k: 'set', flag: 'n_gunnhildr_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'You carry a light with you. A stone woke in the south, I felt it. Was that your doing?',
        sv: 'Du bär ett ljus med dig. En sten vaknade i söder, jag kände det. Var det ditt verk?',
      },
    },
    day: {
      text: {
        en: 'Kneel whenever you like. The gods keep a better record of your road than any skald.',
        sv: 'Knäfall när du vill. Gudarna minns din väg bättre än någon skald.',
      },
    },
    night: {
      text: {
        en: 'The hof never shuts. The dead walk outside, and the living need somewhere to be afraid in.',
        sv: 'Hovet stängs aldrig. De döda vandrar därute, och de levande behöver någonstans att vara rädda.',
      },
    },
  },
};
