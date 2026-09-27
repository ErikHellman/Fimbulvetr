import type { DialogueDef } from '@core/story/dialogue';
import { all, evening, flag, not } from './util';

/** Önundr the woodcutter, in his clearing by day and his hut by night. */
export const ONUNDR: DialogueDef = {
  entry: [
    { when: not(flag('n_onundr_met')), node: 'meet' },
    { when: all(flag('st_stone1_lit'), not(flag('st_road_open'))), node: 'road' },
    { when: flag('st_road_open'), node: 'north' },
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
    road: {
      text: {
        en: 'The old stone under the roots burns again. I felt it in my axe handle. You did that, lad?',
        sv: 'Den gamla stenen under rötterna brinner igen. Jag kände det i yxskaftet. Var det du, pojk?',
      },
      next: 'road2',
    },
    road2: {
      text: {
        en: 'Then you need Uppvík, where the traders and the rune-carver are. The road north lies under that fallen pine. Leave it to me.',
        sv: 'Då behöver du Uppvík, där handlarna och runristaren finns. Vägen norrut ligger under den fallna tallen. Lämna den åt mig.',
      },
      next: 'road3',
    },
    road3: {
      text: {
        en: 'There. Sawn through while we talked, near enough. Follow the road north past the deep pines.',
        sv: 'Så. Genomsågad medan vi pratade, nästan. Följ vägen norrut förbi de djupa tallarna.',
      },
      do: [{ k: 'set', flag: 'st_road_open', value: true }],
    },
    north: {
      text: {
        en: 'Uppvík shuts its gate at dark. Knock hard, and Bersi might let you in before the dead catch up.',
        sv: 'Uppvík stänger porten när det mörknar. Knacka hårt, så släpper Bersi kanske in dig innan de döda hinner ikapp.',
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
