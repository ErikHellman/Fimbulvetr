import type { ScriptDef } from '@core/story/script';
import type { ScriptId } from '../ids';

/**
 * Praying at a hof's rune-stone: health comes back, and the gods keep a record of the journey (the three
 * save slots). Mead halls offer the same rest.
 */
const hofPray: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: null,
      text: {
        en: 'You kneel at the rune-stone. The old carvings are cold under your hand, and your breath steadies.',
        sv: 'Du knäfaller vid runstenen. De gamla ristningarna är kalla under din hand, och andetagen lugnar sig.',
      },
    },
    { k: 'do', effects: [{ k: 'heal', n: 0 }] },
    { k: 'save' },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The gods remember what you have done.',
        sv: 'Gudarna minns det du har gjort.',
      },
    },
  ],
};

export const HOF_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  hof_pray: hofPray,
};
