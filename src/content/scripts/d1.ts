import type { ScriptDef } from '@core/story/script';

/** The first steps into Rótarhellir. */
const d1Enter: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_d1_entered', value: true }] },
    {
      k: 'say',
      who: 'ask',
      text: {
        en: 'Roots everywhere, thick as a man. And something down here is breathing.',
        sv: 'Rötter överallt, tjocka som en karl. Och något här nere andas.',
      },
    },
  ],
};

export const D1_SCRIPTS: Readonly<Record<'d1_enter', ScriptDef>> = {
  d1_enter: d1Enter,
};
