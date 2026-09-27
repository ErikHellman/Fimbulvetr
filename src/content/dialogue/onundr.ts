import type { DialogueDef } from '@core/story/dialogue';
import { evening, flag, not } from './util';

/** Önundr the woodcutter, in his clearing by day and his hut by night. */
export const ONUNDR: DialogueDef = {
  entry: [
    { when: not(flag('n_onundr_met')), node: 'meet' },
    { when: evening, node: 'night' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'A farm lad, this deep in Myrkviðr? Then it is true. The trolls came down through my wood two nights ago.',
        sv: 'En gårdspojke, så här djupt inne i Myrkviðr? Då är det sant. Trollen kom ner genom min skog för två nätter sedan.',
      },
      do: [{ k: 'set', flag: 'n_onundr_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'I hid in the woodpile like a coward. Önundr is my name. If you need a fire and a roof, knock.',
        sv: 'Jag gömde mig i vedtraven som en ynkrygg. Önundr heter jag. Behöver du eld och tak, så knacka.',
      },
    },
    day: {
      text: {
        en: 'Leaves hide all sorts in autumn. Cut through a pile and you never know what you find. Old coins. A lost boot.',
        sv: 'Löven gömmer allt möjligt om hösten. Hugg igenom en hög och man vet aldrig vad man hittar. Gamla mynt. En borttappad känga.',
      },
    },
    night: {
      text: {
        en: 'Shut the door behind you. The dead walk in the hollow past the clearing, and they do not knock.',
        sv: 'Stäng dörren efter dig. De döda går i sänkan bortom gläntan, och de knackar inte.',
      },
    },
  },
};
