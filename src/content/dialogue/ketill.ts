import type { DialogueDef } from '@core/story/dialogue';
import { evening, flag, not } from './util';

/** Ketill the smith sells from his anvil: outside by day, inside when it rains. */
export const KETILL: DialogueDef = {
  entry: [
    { when: not(flag('n_ketill_met')), node: 'meet' },
    { when: evening, node: 'night' },
    { when: { k: 'weather', is: ['rain', 'storm'] }, node: 'rain' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Stand back from the sparks. Ketill. If it is iron and broken, I mend it. If it is silver, I take it.',
        sv: 'Stå undan från gnistorna. Ketill. Är det järn och trasigt så lagar jag det. Är det silver så tar jag det.',
      },
      do: [{ k: 'set', flag: 'n_ketill_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'That seax is a farm knife. An Uppvík sword bites deeper, and a byrnie takes the edge off a blow.',
        sv: 'Den där saxen är en gårdskniv. Ett Uppvíksvärd biter djupare, och en brynja tar udden av ett hugg.',
      },
    },
    day: {
      text: {
        en: 'Want something? Everything I sell is laid out on the anvil. Look, but mind the hot end.',
        sv: 'Vill du något? Allt jag säljer ligger på städet. Titta, men akta den heta änden.',
      },
    },
    rain: {
      text: {
        en: 'Rain puts a forge out if you let it. So I do not let it. The wares are on the anvil in here.',
        sv: 'Regnet släcker en ässja om man låter det. Så jag låter det inte. Varorna ligger på städet här inne.',
      },
    },
    night: {
      text: {
        en: 'No hammering after dark, Þórdís says. The anvil can wait. The mead cannot.',
        sv: 'Ingen hamring efter mörkrets inbrott, säger Þórdís. Städet kan vänta. Mjödet kan inte det.',
      },
    },
  },
};
