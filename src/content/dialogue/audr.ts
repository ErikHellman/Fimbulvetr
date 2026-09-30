import type { DialogueDef } from '@core/story/dialogue';
import { flag, not } from './util';

/** Auðr, a reed-cutter's girl, who has seen something shining on the islet in the reed lake. */
export const AUDR: DialogueDef = {
  entry: [
    { when: not(flag('n_audr_met')), node: 'meet' },
    { when: { k: 'season', is: 'winter' }, node: 'winter' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Are you lost? Everyone who comes this way is lost. I am Auðr. I cut reeds for thatch.',
        sv: 'Har du gått vilse? Alla som kommer hit har gått vilse. Jag heter Auðr. Jag skär vass till tak.',
      },
      do: [{ k: 'set', flag: 'n_audr_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'There is a little island out in the lake, and something shines on it. Too far to throw a stone to. When the water goes hard in winter, I am going to walk out there.',
        sv: 'Det finns en liten ö ute i sjön, och något glänser där. För långt bort att kasta en sten dit. När vattnet blir hårt i vinter ska jag gå ut dit.',
      },
    },
    day: {
      text: {
        en: 'Reeds cut in autumn make the best thatch. Mother says so. Mother says a lot of things.',
        sv: 'Vass som skärs på hösten blir det bästa taket. Det säger mamma. Mamma säger mycket.',
      },
    },
    winter: {
      text: {
        en: 'The lake has gone hard! You go first. If you fall through, I will know not to.',
        sv: 'Sjön har blivit hård! Gå du först. Om du går igenom vet jag att jag inte ska.',
      },
    },
  },
};
