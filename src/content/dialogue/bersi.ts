import type { DialogueDef } from '@core/story/dialogue';
import { evening, flag, not } from './util';

/** Bersi keeps Uppvík's gate: open by day, barred at night, whatever the weather. */
export const BERSI: DialogueDef = {
  entry: [
    { when: not(flag('n_bersi_met')), node: 'meet' },
    { when: { k: 'weather', is: ['rain', 'storm'] }, node: 'rain' },
    { when: evening, node: 'evening' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Halt. A lad, alone, off the forest road? Bersi, warden of this gate. Keep your blade sheathed in town.',
        sv: 'Stanna. En pojk, ensam, från skogsvägen? Bersi, väktare vid den här porten. Håll klingan i skidan i stan.',
      },
      do: [{ k: 'set', flag: 'n_bersi_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'The gate is barred at night. Knock and I will open it, grumbling. Knock twice and I bite.',
        sv: 'Porten är bommad om natten. Knacka så öppnar jag, med knot. Knacka två gånger så biter jag.',
      },
    },
    day: {
      text: {
        en: 'Traders in, traders out. Fewer every year. The vargar on the north road see to that.',
        sv: 'Handlare in, handlare ut. Färre för varje år. Vargarna på norra vägen ser till det.',
      },
    },
    evening: {
      text: {
        en: 'Get inside the palisade before dark, lad. I bar this gate at night, and nobody argues with me.',
        sv: 'Kom innanför pålverket före mörkret, pojk. Jag bommar porten om natten, och ingen säger emot mig.',
      },
    },
    rain: {
      text: {
        en: 'Rain down my neck, and still I stand here. That is the job. Do not tell Þórdís I said it is a good one.',
        sv: 'Regn längs nacken, och ändå står jag här. Det är jobbet. Säg inte till Þórdís att jag tycker om det.',
      },
    },
  },
};
