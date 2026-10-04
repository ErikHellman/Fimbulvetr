import type { DialogueDef } from '@core/story/dialogue';
import { flag, not } from './util';

/** Steinn, an old huscarl by the mead-hall fire. He stood with Halvar at the binding and will not say so. */
export const STEINN: DialogueDef = {
  entry: [
    { when: not(flag('n_steinn_met')), node: 'meet' },
    { when: flag('st_pass_open'), node: 'fimbul' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Sit by the fire, lad. My knees do not stand for guests. Steinn. I carried a shield for the old jarl, once.',
        sv: 'Sätt dig vid elden, pojk. Mina knän reser sig inte för gäster. Steinn. Jag bar sköld åt den gamle jarlen en gång.',
      },
      do: [{ k: 'set', flag: 'n_steinn_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'Askdalr, you say? A Halvar went to farm there. Big man, quiet. Is he still living?',
        sv: 'Askdalr, säger du? En Halvar flyttade dit och blev bonde. Stor karl, tystlåten. Lever han än?',
      },
      next: 'meet3',
    },
    meet3: {
      text: {
        en: 'Wounded? Ha. He always took the blows meant for others. We stood together under the mountain, he and I.',
        sv: 'Sårad? Ha. Han tog alltid de hugg som var ämnade åt andra. Vi stod tillsammans under berget, han och jag.',
      },
      next: 'meet4',
    },
    meet4: {
      text: {
        en: 'Ask him about it someday. He will not tell you. Nor will I. Some oaths weigh more than the men who swore them.',
        sv: 'Fråga honom om det någon gång. Han berättar det inte. Inte jag heller. Somliga eder väger mer än de som svor dem.',
      },
    },
    day: {
      text: {
        en: 'The fire is warm, the mead is thin, and the winters grow longer. I have seen this before, lad. Once.',
        sv: 'Elden är varm, mjödet är tunt, och vintrarna blir längre. Jag har sett det här förut, pojk. En gång.',
      },
    },
    fimbul: {
      text: {
        en: 'This is the cold I saw once, lad. It came down from the mountain the same way. And then, too, a man walked up to meet it.',
        sv: 'Det här är kölden jag såg en gång, pojk. Den kom ner från berget på samma sätt. Och då, också, gick en man upp för att möta den.',
      },
    },
  },
};
