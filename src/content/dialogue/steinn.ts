import type { DialogueDef } from '@core/story/dialogue';
import { all, flag, not } from './util';

/** Steinn, an old huscarl by the mead-hall fire. He stood with Halvar at the binding and will not say so. */
export const STEINN: DialogueDef = {
  entry: [
    { when: not(flag('n_steinn_met')), node: 'meet' },
    { when: flag('q_steinn_done'), node: 'clasp_after' },
    { when: all(flag('q_steinn_asked'), flag('q_steinn_answer')), node: 'answer' },
    { when: flag('q_steinn_asked'), node: 'clasp_wait' },
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
      next: 'clasp',
    },
    clasp: {
      text: {
        en: 'You are Halvar’s lad. Take him this clasp from my old mail. He will know it. Ask him if he remembers what we swore over it, and bring me his answer.',
        sv: 'Du är Halvars pojk. Ge honom det här spännet från min gamla brynja. Han känner igen det. Fråga om han minns vad vi svor över det, och kom tillbaka med hans svar.',
      },
      do: [
        { k: 'give', item: 'mail_clasp' },
        { k: 'set', flag: 'q_steinn_asked', value: true },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
    },
    clasp_wait: {
      text: {
        en: 'Halvar has the farm in Askdalr. Give him the clasp, and mind his face when he sees it.',
        sv: 'Halvar har gården i Askdalr. Ge honom spännet, och se på hans ansikte när han ser det.',
      },
    },
    answer: {
      text: {
        en: '“Every word, and I wish I did not.” Ha. That is Halvar. We swore never to speak of it, and here we are, two old men, not speaking of it.',
        sv: '”Varje ord, och jag önskar att jag inte gjorde det.” Ha. Det är Halvar. Vi svor att aldrig tala om det, och här sitter vi, två gamla män, och talar inte om det.',
      },
      do: [
        { k: 'silver', n: 150 },
        { k: 'set', flag: 'q_steinn_done', value: true },
        { k: 'sfx', id: 'sfx_buy' },
      ],
      next: 'answer2',
    },
    answer2: {
      text: {
        en: 'There, for your legs. What we swore stays between us and the mountain, lad. For now.',
        sv: 'Där, för dina ben. Det vi svor stannar mellan oss och berget, pojk. Tills vidare.',
      },
    },
    clasp_after: {
      text: {
        en: 'Tell Halvar the mead here is still bad. He will understand.',
        sv: 'Säg till Halvar att mjödet här fortfarande är dåligt. Han förstår.',
      },
    },
  },
};
