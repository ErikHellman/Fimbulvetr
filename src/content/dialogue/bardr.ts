import type { DialogueDef } from '@core/story/dialogue';
import { flag, not } from './util';

/** Bárðr the ferryman rows nobody toward the mountains; once the pass opens, the lake is ice. */
export const BARDR: DialogueDef = {
  entry: [
    { when: not(flag('n_bardr_met')), node: 'meet' },
    { when: flag('st_pass_open'), node: 'frozen' },
    { when: { k: 'season', is: 'winter' }, node: 'winter' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Looking for passage? Not north. Not across. Not toward the mountains, not this year. Bárðr. I ferry, when there is somewhere sane to ferry to.',
        sv: 'Söker du överfart? Inte norrut. Inte över. Inte mot bergen, inte i år. Bárðr. Jag för över folk, när det finns någonstans vettigt att föra dem.',
      },
      do: [{ k: 'set', flag: 'n_bardr_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'The lake reaches up to the feet of the mountains, and something breathes cold down from them. I watched ice creep in from the far shore in midsummer.',
        sv: 'Sjön når ända upp till bergens fot, och något andas kallt ner från dem. Jag såg isen krypa in från andra stranden mitt i sommaren.',
      },
      next: 'meet3',
    },
    meet3: {
      text: {
        en: 'So I row nobody that way until the pass is open. Ask me again then.',
        sv: 'Så jag ror ingen åt det hållet förrän passet är öppet. Fråga mig igen då.',
      },
    },
    day: {
      text: {
        en: 'Nobody rows toward the mountains. Ask me again when the pass is open.',
        sv: 'Ingen ror mot bergen. Fråga mig igen när passet är öppet.',
      },
    },
    winter: {
      text: {
        en: 'See how the channel steams? The warm springs keep it open, the only water on the lake not frozen. My boat sits in it like an egg in a nest.',
        sv: 'Ser du hur rännan ångar? De varma källorna håller den öppen, det enda vattnet på sjön som inte fryser. Båten ligger i den som ett ägg i ett bo.',
      },
    },
    frozen: {
      text: {
        en: 'The lake froze in one night. I will not row on that, and I will not walk it yet.',
        sv: 'Sjön frös på en natt. Jag ror inte på den där, och jag går inte på den än.',
      },
    },
  },
};
