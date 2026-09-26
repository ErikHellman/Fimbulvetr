import type { DialogueDef } from '@core/story/dialogue';
import { daily } from './util';

/** Rannveig, the neighbour. */
export const RANNVEIG: DialogueDef = daily(
  [
    {
      en: 'Do not mind Þorkell. He talks more to the goats than to me.',
      sv: 'Bry dig inte om Þorkell. Han pratar mer med getterna än med mig.',
    },
  ],
  [
    {
      en: 'A word of advice: never marry a man who names his goats.',
      sv: 'Ett råd: gift dig aldrig med en man som döper sina getter.',
    },
  ],
  [{ en: 'Bar your doors tonight, Ask. I mean it.', sv: 'Bomma dörrarna i natt, Ask. Jag menar allvar.' }],
  { en: 'Told him. I told him.', sv: 'Jag sa det till honom. Jag sa det.' },
);
