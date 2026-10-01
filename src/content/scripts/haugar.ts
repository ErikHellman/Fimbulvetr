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

/** Geirmundr's wares, from the mouth of his tent. */
const shopGeirmundr: ScriptDef = {
  steps: [
    { k: 'talk', dialogue: 'geirmundr', with: 'geirmundr' },
    { k: 'shop', id: 'geirmundr' },
  ],
};

/** The first steps into Konungshaugr. */
const d3Enter: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_d3_entered', value: true }] },
    {
      k: 'say',
      who: 'ask',
      text: {
        en: 'Cold air, old smoke, and gold gleaming in the dark. Nothing down here is asleep for good.',
        sv: 'Kall luft, gammal rök och guld som glimmar i mörkret. Inget här nere sover för gott.',
      },
    },
  ],
};

/**
 * The Haugbúi King is dust: Ask lights the third runestone and learns Farvegr from it. Kolbeinn's king
 * stirs; Ask comes out by the barrow's door, and M4 ends.
 */
const stone3Light: ScriptDef = {
  steps: [
    {
      k: 'do',
      effects: [
        { k: 'set', flag: 'st_stone3_lit', value: true },
        { k: 'learn', galdr: 'farvegr' },
        { k: 'sfx', id: 'sfx_warp' },
      ],
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Ask lays a hand on the stone. The runes wake one by one, and each is a road: a song of every place a warp stone stands.',
        sv: 'Ask lägger handen på stenen. Runorna vaknar en efter en, och var och en är en väg: en sång om varje plats där en färdsten står.',
      },
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'You learned Farvegr, the way-song! Ready it in the menu, and sing it under the open sky to walk to any warp stone you have woken.',
        sv: 'Du lärde dig Farvegr, vägsången! Gör den redo i menyn och sjung den under bar himmel för att gå till vilken färdsten du än har väckt.',
      },
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Three stones awake. In the north, a door of stone grows warm.',
        sv: 'Tre stenar är vakna. I norr blir en dörr av sten varm.',
      },
    },
    { k: 'fade', out: true },
    {
      k: 'card',
      text: {
        en: 'In the hall of ice, the empty throne is empty no longer.',
        sv: 'I isens sal är den tomma tronen inte längre tom.',
      },
    },
    {
      k: 'say',
      who: 'kolbeinn',
      text: {
        en: 'All three, my king. Let the boy open the pass for us. We will be waiting on the other side.',
        sv: 'Alla tre, min konung. Låt pojken öppna passet åt oss. Vi väntar på andra sidan.',
      },
    },
    { k: 'warp', screen: 'hau_king', at: { x: 20, y: 12 }, facing: 's' },
    { k: 'fade', out: false },
    { k: 'card', text: { en: 'To be continued.', sv: 'Fortsättning följer.' } },
  ],
};

export const HAUGAR_SCRIPTS: Readonly<
  Record<
    | 'warp_stone'
    | 'hau_arrive'
    | 'barrow_open'
    | 'styrr_rest'
    | 'd3_enter'
    | 'stone3_light'
    | 'shop_geirmundr',
    ScriptDef
  >
> = {
  d3_enter: d3Enter,
  shop_geirmundr: shopGeirmundr,
  stone3_light: stone3Light,
  warp_stone: warpStone,
  hau_arrive: hauArrive,
  barrow_open: barrowOpen,
  styrr_rest: styrrRest,
};
