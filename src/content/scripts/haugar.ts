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

/** Past the rockfall: Ask has come into Haugar. */
const hauArrive: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_haugar_reached', value: true }] },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The trees fall away behind. Heather, grave-hills and standing stones under a wide grey sky. Haugar, where the old dead sleep.',
        sv: 'Träden faller undan bakom. Ljung, gravkullar och resta stenar under en vid grå himmel. Haugar, där de gamla döda sover.',
      },
    },
  ],
};

/** The barrow-watch is kept: the King's Barrow opens. */
const barrowOpen: ScriptDef = {
  steps: [
    {
      k: 'do',
      effects: [
        { k: 'set', flag: 'st_barrow_open', value: true },
        { k: 'sfx', id: 'sfx_gate' },
      ],
    },
    { k: 'wait', ticks: 30 },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The last wight crumbles into the mound it came from. Deep in the hill, stone grinds on stone: the barrow’s door stands open.',
        sv: 'Den sista gravvätten smulas sönder i högen den kom ur. Djupt i kullen skaver sten mot sten: gravhögens dörr står öppen.',
      },
    },
  ],
};

/** Styrr's spare bed: rest and the save slots. */
const styrrRest: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: 'styrr',
      text: {
        en: 'Sleep, then. I will keep the door. Old habit.',
        sv: 'Sov, då. Jag håller dörren. Gammal vana.',
      },
    },
    { k: 'do', effects: [{ k: 'heal', n: 0 }] },
    { k: 'save' },
  ],
};

export const HAUGAR_SCRIPTS: Readonly<
  Record<'warp_stone' | 'hau_arrive' | 'barrow_open' | 'styrr_rest', ScriptDef>
> = {
  warp_stone: warpStone,
  hau_arrive: hauArrive,
  barrow_open: barrowOpen,
  styrr_rest: styrrRest,
};
