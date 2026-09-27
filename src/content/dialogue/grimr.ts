import type { DialogueDef } from '@core/story/dialogue';
import { afterRaid, daily, flag } from './util';

/** Grímr before and during the raid. */
const BEFORE: DialogueDef = daily(
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

/** Grímr keeps the north gate. After the raid he opens it once Gyða has spoken. */
export const GRIMR: DialogueDef = {
  entry: [{ when: flag('st_legend_told'), node: 'open' }, { when: afterRaid, node: 'shut' }, ...BEFORE.entry],
  nodes: {
    ...BEFORE.nodes,
    shut: {
      text: {
        en: 'They came over the palisade as if it were not there. The gate stays shut until Gyða says otherwise.',
        sv: 'De kom över pallisaden som om den inte fanns. Porten förblir stängd tills Gyða säger annat.',
      },
    },
    open: {
      text: {
        en: 'The gate is open. Keep to the road through Myrkviðr, and bring them back, Ask.',
        sv: 'Porten är öppen. Håll dig till vägen genom Myrkviðr, och för hem dem, Ask.',
      },
    },
  },
};
