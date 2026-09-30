import type { ScriptDef } from '@core/story/script';

/** A warp stone touched: it hums, and Farvegr (once known) could bring Ask back to it. */
const warpStone: ScriptDef = {
  steps: [
    {
      k: 'if',
      when: { k: 'galdr', id: 'farvegr' },
      then: [
        {
          k: 'say',
          who: null,
          text: {
            en: 'The stone is awake. Sing Farvegr anywhere under the open sky, and it will call Ask back here.',
            sv: 'Stenen är vaken. Sjung Farvegr var som helst under bar himmel, så kallar den Ask tillbaka hit.',
          },
        },
      ],
      else: [
        {
          k: 'say',
          who: null,
          text: {
            en: 'Ask lays a hand on the rune-cut stone. It hums, and the runes wake with a pale light. Some song must know the way back to it.',
            sv: 'Ask lägger handen på den runhuggna stenen. Den surrar, och runorna vaknar med ett blekt sken. Någon sång måste känna vägen tillbaka hit.',
          },
        },
      ],
    },
  ],
};

export const HAUGAR_SCRIPTS: Readonly<Record<'warp_stone', ScriptDef>> = {
  warp_stone: warpStone,
};
