import type { DialogueDef } from '@core/story/dialogue';
import { all, flag, not } from './util';

/**
 * Kolbeinn does not talk with farmhands. He talks at them. Beaten in his hall (M10a), he kneels, and Ask
 * spares him or kills him.
 */
export const KOLBEINN: DialogueDef = {
  entry: [
    {
      when: all(flag('st_kolbeinn_beaten'), not(flag('st_kolbeinn_spared')), not(flag('st_kolbeinn_slain'))),
      node: 'yield',
    },
    { node: 'sneer' },
  ],
  nodes: {
    yield: {
      text: {
        en: 'Well. The thrall’s boy beat the thrall. Go on, then. It is what they would do, your goði and your old huscarl. It is what they did to him.',
        sv: 'Nå. Trälens pojk slog trälen. Gör det, då. Det är vad de skulle göra, din gode och din gamle huskarl. Det är vad de gjorde mot honom.',
      },
      choices: [
        {
          text: {
            en: 'Get up. Walk south, and do not come back.',
            sv: 'Res dig. Gå söderut, och kom inte tillbaka.',
          },
          do: [{ k: 'set', flag: 'st_kolbeinn_spared', value: true }],
          next: 'spared',
        },
        {
          text: { en: 'For Askdalr.', sv: 'För Askdalr.' },
          do: [{ k: 'set', flag: 'st_kolbeinn_slain', value: true }],
          next: 'slain',
        },
      ],
    },
    spared: {
      text: {
        en: 'South. ... I have not seen the sea since I was a boy. He will not thank you for this, you know. Neither will they.',
        sv: 'Söderut. ... Jag har inte sett havet sedan jag var pojke. Han kommer inte att tacka dig för det här, ska du veta. Inte de heller.',
      },
    },
    slain: {
      who: null,
      text: {
        en: 'He does not lift a hand. When it is done, the rime in the hall goes still, and the door to the west stands open.',
        sv: 'Han lyfter inte en hand. När det är gjort blir rimfrosten i salen stilla, och dörren åt väster står öppen.',
      },
    },
    sneer: {
      text: {
        en: 'Run back to your burning house, boy. This night is not about you.',
        sv: 'Spring tillbaka till ditt brinnande hus, pojk. Den här natten handlar inte om dig.',
      },
    },
  },
};
