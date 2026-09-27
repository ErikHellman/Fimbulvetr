import type { DialogueDef } from '@core/story/dialogue';
import { flag, not } from './util';

/** Sölvi the rune-carver, among his standing stones. */
export const SOLVI: DialogueDef = {
  entry: [{ when: not(flag('n_solvi_met')), node: 'meet' }, { node: 'day' }],
  nodes: {
    meet: {
      text: {
        en: 'Mind the stones, the paint is still wet. Sölvi. I carve runes, and I listen to what they say back.',
        sv: 'Akta stenarna, färgen är inte torr än. Sölvi. Jag ristar runor, och jag lyssnar på vad de svarar.',
      },
      do: [{ k: 'set', flag: 'n_solvi_met', value: true }],
    },
    day: {
      text: {
        en: 'Each rune is a word the world once agreed to. Sing it true and the world remembers.',
        sv: 'Varje runa är ett ord som världen en gång gick med på. Sjung den rätt så minns världen.',
      },
    },
  },
};
