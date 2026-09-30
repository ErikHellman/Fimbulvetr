import type { DialogueDef } from '@core/story/dialogue';
import { flag, not } from './util';

/** Ljótr the peat-cutter: warnings about the bog-lights and the spring floods. */
export const LJOTR: DialogueDef = {
  entry: [
    { when: not(flag('n_ljotr_met')), node: 'meet' },
    { when: { k: 'season', is: 'spring' }, node: 'spring' },
    { when: { k: 'season', is: 'winter' }, node: 'winter' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Mind where you step, it is all bog under the turf. Ljótr. I cut peat, I dry peat, I burn peat. Peat.',
        sv: 'Se dig för var du sätter fötterna, det är gungfly under torven. Ljótr. Jag skär torv, torkar torv, eldar torv. Torv.',
      },
      do: [{ k: 'set', flag: 'n_ljotr_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'At night the lights come out over the cuttings. Do not follow them. My brother followed them.',
        sv: 'Om natten kommer ljusen fram över torvtagen. Följ dem inte. Min bror följde dem.',
      },
    },
    day: {
      text: {
        en: 'Bog-lights drift close, flare up bright, then come at you. Two good blows and they go out. Two.',
        sv: 'Lyktgubbarna driver närmare, flammar upp och kommer mot dig. Två ordentliga hugg så slocknar de. Två.',
      },
    },
    spring: {
      text: {
        en: 'The river is up, as every spring. The meltwater runs over the shoal and nobody wades it. Take the old bridge at the bend.',
        sv: 'Ån har stigit, som varje vår. Smältvattnet forsar över grundet och ingen vadar över. Ta den gamla bron vid kröken.',
      },
    },
    winter: {
      text: {
        en: 'The cuttings freeze hard. Good for walking, bad for cutting. Bad for me.',
        sv: 'Torvtagen fryser till sten. Bra att gå på, dåligt att skära i. Dåligt för mig.',
      },
    },
  },
};
