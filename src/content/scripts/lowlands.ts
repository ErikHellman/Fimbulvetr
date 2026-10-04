import type { ScriptDef } from '@core/story/script';

/** The trading chain's start: Ulf's sheep's bell in the ashes of the burned fold. */
const findBell: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: null,
      text: {
        en: 'Something rings in the ashes of the fold: Ulf’s sheep’s bell, still on its strap.',
        sv: 'Något klingar i fållans aska: Ulfs fårskälla, fortfarande på sin rem.',
      },
    },
    {
      k: 'do',
      effects: [
        { k: 'give', item: 'trade_bell' },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Ulf was taken with the others, and his sheep are gone. Someone who still has sheep could use it.',
        sv: 'Ulf togs med de andra, och hans får är borta. Någon som fortfarande har får kunde ha nytta av den.',
      },
    },
  ],
};

export const LOWLAND_SCRIPTS: Readonly<Record<'find_bell', ScriptDef>> = {
  find_bell: findBell,
};
