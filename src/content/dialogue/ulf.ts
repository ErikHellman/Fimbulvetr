import type { DialogueDef } from '@core/story/dialogue';
import { daily, flag } from './util';

/** Ulf, the shepherd boy, before the raid. */
const DAYS: DialogueDef = daily(
  [
    {
      en: 'Halvar’s sheep never listen to me either. Walk at them and they go the other way. Easy. Mostly.',
      sv: 'Halvars får lyssnar aldrig på mig heller. Gå mot dem så går de åt andra hållet. Lätt. Oftast.',
    },
  ],
  [
    {
      en: 'I found a lamb up on the ridge once. There is something shiny behind the rocks up there. I could not lift them.',
      sv: 'Jag hittade ett lamm uppe på åsen en gång. Det finns något som glänser bakom stenarna där uppe. Jag orkade inte lyfta dem.',
    },
  ],
  [
    {
      en: 'Can you teach me to throw like that? The ravens are still screaming about you.',
      sv: 'Kan du lära mig kasta sådär? Korparna skriker fortfarande om dig.',
    },
  ],
  { en: 'Ask! Where is everyone going?', sv: 'Ask! Vart är alla på väg?' },
);

/**
 * Ulf: taken in the raid, held in a cell in Helgrind until Náströnd falls, then home to the pasture, where
 * his herding round (five into the fold before the sand runs out) can be played again for silver.
 */
export const ULF: DialogueDef = {
  entry: [
    { when: flag('st_freed_ulf'), node: 'home' },
    { when: flag('st_raid_done'), node: 'cell' },
    ...DAYS.entry,
  ],
  nodes: {
    ...DAYS.nodes,
    cell: {
      text: {
        en: 'Ask? Ask! The big one with the shield wears the key to these chains. He walks the hall past the bone gate. I can hear him.',
        sv: 'Ask? Ask! Den stora med skölden bär nyckeln till kedjorna. Han går i salen bortom benporten. Jag hör honom.',
      },
      next: 'cell_tofa',
    },
    cell_tofa: {
      text: {
        en: 'Tófa is here too, in a cell over the river. She stopped crying yesterday. That is worse.',
        sv: 'Tófa är också här, i en cell över floden. Hon slutade gråta i går. Det är värre.',
      },
    },
    home: {
      text: {
        en: 'Home! The sheep remembered me. Well, they ran away from me, which is how I know they remembered.',
        sv: 'Hemma! Fåren kom ihåg mig. Nåja, de sprang ifrån mig, och det är så jag vet att de kom ihåg.',
      },
      next: 'herd',
    },
    herd: {
      text: {
        en: 'Want to race the sand? Five into the fold before it runs out, and I will pay twenty silver.',
        sv: 'Vill du tävla mot sanden? Fem in i fållan innan den runnit ut, så betalar jag tjugo silver.',
      },
      choices: [
        {
          text: { en: 'Herd the flock.', sv: 'Driv hjorden.' },
          do: [{ k: 'set', flag: 'ev_ulf_herd', value: true }],
        },
        { text: { en: 'Not now.', sv: 'Inte nu.' } },
      ],
    },
  },
};
