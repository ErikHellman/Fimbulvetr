import type { DialogueDef } from '@core/story/dialogue';
import { daily } from './util';

/** Gyða, the goði, keeps the rune-records in the hof. */
export const GYDA: DialogueDef = daily(
  [
    {
      en: 'The runestones on the ridge have gone dark, child. Stones do not tire.',
      sv: 'Runstenarna på åsen har slocknat, barn. Stenar blir inte trötta.',
    },
    {
      en: 'Go and look for yourself if you doubt an old woman.',
      sv: 'Gå och se själv om du tvivlar på en gammal kvinna.',
    },
  ],
  [
    {
      en: 'My grandmother kept the old oaths. I kept the records. Neither of us kept the stones lit.',
      sv: 'Min farmor höll de gamla eden. Jag höll förteckningarna. Ingen av oss höll stenarna tända.',
    },
  ],
  [
    {
      en: 'If a horn sounds tonight, come to the hof. Do not wait for daylight.',
      sv: 'Om ett horn ljuder i natt, kom till hovet. Vänta inte på dagsljuset.',
    },
  ],
  { en: 'It has begun. Go, child. Run.', sv: 'Det har börjat. Spring, barn. Spring.' },
);
