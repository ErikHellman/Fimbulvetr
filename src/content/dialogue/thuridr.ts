import type { DialogueDef } from '@core/story/dialogue';
import { evening, flag, not } from './util';

/** Þuríðr, the miller's widow: how the mill sank, and the stone in its cellar. */
export const THURIDR: DialogueDef = {
  entry: [
    { when: not(flag('n_thuridr_met')), node: 'meet' },
    { when: not(flag('q_rs2_mill')), node: 'mill' },
    { when: flag('st_stone2_lit'), node: 'lit' },
    { when: evening, node: 'night' },
    { node: 'waiting' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'A visitor? Come in, you are dripping on my floor. Þuríðr. My husband was the miller. Was.',
        sv: 'Besök? Kom in, du droppar på mitt golv. Þuríðr. Min man var mjölnare. Var.',
      },
      do: [{ k: 'set', flag: 'n_thuridr_met', value: true }],
      next: 'mill',
    },
    mill: {
      text: {
        en: 'The mill sank last spring. The water rose in one night, black and stinking, and something came up the race. Long, like a log with eyes.',
        sv: 'Kvarnen sjönk i våras. Vattnet steg på en natt, svart och stinkande, och något kom upp genom rännan. Långt, som en stock med ögon.',
      },
      next: 'mill2',
    },
    mill2: {
      text: {
        en: 'A stone, you say? The old folk said the mill was built over a runestone, in the cellar, so the wheel would turn for ever. Well. The wheel stopped.',
        sv: 'En sten, säger du? De gamla sa att kvarnen byggdes ovanpå en runsten, i källaren, så att hjulet skulle snurra för evigt. Nå. Hjulet stannade.',
      },
      next: 'mill3',
    },
    mill3: {
      text: {
        en: 'The door at the end of the plank walk still opens, if you dare it. The wheels inside let the water in and out. Rest here when you need to.',
        sv: 'Dörren vid plankgångens ände går fortfarande att öppna, om du vågar. Hjulen där inne släpper in och ut vattnet. Vila här när du behöver.',
      },
      do: [{ k: 'set', flag: 'q_rs2_mill', value: true }],
    },
    waiting: {
      text: {
        en: 'Mind the wheels down there. My husband always said there was more mill under the pond than above it.',
        sv: 'Akta dig för hjulen där nere. Min man sa alltid att det fanns mer kvarn under dammen än ovanför.',
      },
    },
    lit: {
      text: {
        en: 'The pond went still last night, and the mud is quiet. Whatever you did down there, I slept. The peat-cutters say the next stone is east, among the barrows. Go carefully.',
        sv: 'Dammen blev stilla i natt, och dyn är tyst. Vad du än gjorde där nere, så sov jag. Torvskärarna säger att nästa sten ligger österut, bland gravhögarna. Gå försiktigt.',
      },
    },
    night: {
      text: {
        en: 'Sleep here if you like. The pond is loud at night. Things turn over in the mud.',
        sv: 'Sov här om du vill. Dammen låter om nätterna. Saker vänder sig i dyn.',
      },
    },
  },
};
