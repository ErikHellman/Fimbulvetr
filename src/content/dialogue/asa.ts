import type { DialogueDef } from '@core/story/dialogue';
import { daily } from './util';

/** Ása, the old weaver. */
export const ASA: DialogueDef = daily(
  [
    {
      en: 'My loom has more patience than my knees, dear.',
      sv: 'Min vävstol har mer tålamod än mina knän, kära du.',
    },
  ],
  [
    {
      en: 'Bjarni caught nothing but a boot. He says it is an omen. Of what, a barefoot fish?',
      sv: 'Bjarni fick inget annat än en stövel. Han säger att det är ett omen. För vad, en barfota fisk?',
    },
  ],
  [
    {
      en: 'My grandmother told of a winter that never ended. Silly story. Silly, silly story.',
      sv: 'Min farmor berättade om en vinter som aldrig tog slut. Dum historia. Dum, dum historia.',
    },
  ],
  { en: 'Oh, gods of the hearth…', sv: 'Åh, härdens gudar…' },
);
