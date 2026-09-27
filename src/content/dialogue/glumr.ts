import type { DialogueDef } from '@core/story/dialogue';
import { evening, flag, not } from './util';

/** Glúmr drinks in the mead hall by night and nurses his head outside it by day. He hears things. */
export const GLUMR: DialogueDef = {
  entry: [
    { when: not(flag('n_glumr_met')), node: 'meet' },
    { when: evening, node: 'night' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Sit, sit. Glúmr. Buy me a cup and I will tell you something true. Or two things, and one of them true.',
        sv: 'Sitt, sitt. Glúmr. Bjud mig på en bägare så berättar jag något sant. Eller två saker, och en av dem sann.',
      },
      do: [{ k: 'set', flag: 'n_glumr_met', value: true }],
    },
    day: {
      text: {
        en: 'Too bright. Too loud. Come back after dark, when the mead flows and my head stops ringing.',
        sv: 'För ljust. För högljutt. Kom tillbaka när det är mörkt, när mjödet flödar och huvudet slutar ringa.',
      },
    },
    night: {
      text: {
        en: 'Trolls, lad. Deep in the wood they sleep as stones by day. I sat on one once. By night it was no stone.',
        sv: 'Troll, pojk. Djupt inne i skogen sover de som stenar om dagen. Jag satt på en en gång. Om natten var den ingen sten.',
      },
      next: 'night2',
    },
    night2: {
      text: {
        en: 'And that longhouse by the hall, bolted since spring? Nobody says whose it is. So I say nothing either.',
        sv: 'Och långhuset vid hallen, reglat sedan i våras? Ingen säger vems det är. Så jag säger inget heller.',
      },
    },
  },
};
