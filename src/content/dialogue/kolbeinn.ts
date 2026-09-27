import type { DialogueDef } from '@core/story/dialogue';

/** Kolbeinn does not talk with farmhands. He talks at them. */
export const KOLBEINN: DialogueDef = {
  entry: [{ node: 'sneer' }],
  nodes: {
    sneer: {
      text: {
        en: 'Run back to your burning house, boy. This night is not about you.',
        sv: 'Spring tillbaka till ditt brinnande hus, pojk. Den här natten handlar inte om dig.',
      },
    },
  },
};
