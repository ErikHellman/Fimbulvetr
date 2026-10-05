import type { ScriptDef } from '@core/story/script';
import type { ScriptId } from '../ids';

/**
 * Praying at a hof's rune-stone: health and seiðr come back, and the gods keep a record of the journey
 * (the three save slots). Mead halls offer the same rest, without the seiðr.
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
    {
      k: 'do',
      effects: [
        { k: 'heal', n: 0 },
        { k: 'seidr', n: 0 },
      ],
    },
    { k: 'save' },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The gods remember what you have done.',
        sv: 'Gudarna minns det du har gjort.',
      },
    },
    /** Once the Norns' loom is woven (M7b), the hof may turn the year to another season. */
    { k: 'if', when: { k: 'flag', id: 'st_loom_woven' }, then: [{ k: 'talk', dialogue: 'hof_season' }] },
  ],
};

export const HOF_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  hof_pray: hofPray,
};
