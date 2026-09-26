import type { DialogueDef } from '@core/story/dialogue';
import { daily } from './util';

/** Grímr keeps the north gate. */
export const GRIMR: DialogueDef = daily(
  [
    {
      en: 'The gate stays barred. Gyða’s orders, since the stones went dark.',
      sv: 'Porten förblir bommad. Gyðas order, sedan stenarna slocknade.',
    },
  ],
  [
    {
      en: 'Nobody has come down the Myrkviðr road in six days. Not even a peddler.',
      sv: 'Ingen har kommit ner längs Myrkviðrvägen på sex dagar. Inte ens en gårdfarihandlare.',
    },
  ],
  [
    {
      en: 'I heard wolves last night. No. Not wolves. Something bigger.',
      sv: 'Jag hörde vargar i natt. Nej. Inte vargar. Något större.',
    },
  ],
  { en: 'Get behind the palisade!', sv: 'Kom in bakom pallisaden!' },
);
