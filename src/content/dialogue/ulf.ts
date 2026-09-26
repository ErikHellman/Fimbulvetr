import type { DialogueDef } from '@core/story/dialogue';
import { daily } from './util';

/** Ulf, the shepherd boy. */
export const ULF: DialogueDef = daily(
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
