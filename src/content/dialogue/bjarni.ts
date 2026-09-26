import type { DialogueDef } from '@core/story/dialogue';
import { daily } from './util';

/** Bjarni, the fisher, on his jetty. */
export const BJARNI: DialogueDef = daily(
  [
    {
      en: 'The fish have gone deep. Too deep for late summer.',
      sv: 'Fisken har gått djupt. För djupt för sensommar.',
    },
  ],
  [
    {
      en: 'Caught a boot. Good boot, mind you. Just not a fish.',
      sv: 'Fick en stövel. En bra stövel, ska du veta. Bara inte en fisk.',
    },
  ],
  [{ en: 'Ice on the reeds this morning. Ice!', sv: 'Is på vassen i morse. Is!' }],
  { en: 'Get away from the water, lad!', sv: 'Håll dig borta från vattnet, pojk!' },
);
