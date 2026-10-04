import type { ScriptDef } from '@core/story/script';
import type { ScriptId } from '../ids';
import { HERD_TICKS } from './lowlands';

/** The first steps into Helgrind. */
const d4Enter: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_d4_entered', value: true }] },
    {
      k: 'say',
      who: 'ask',
      text: {
        en: 'The Gjöll roars somewhere under the floor. The air tastes of iron and old fog. Ulf and Tófa are in here somewhere.',
        sv: 'Gjöll dånar någonstans under golvet. Luften smakar järn och gammal dimma. Ulf och Tófa finns här inne någonstans.',
      },
    },
  ],
};

/** The rune-stave rack in the pool hall: three Ís staves, whenever Ask has none left. */
const d4Pedestal: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: null,
      text: {
        en: 'A rack of bone holds rune-staves carved for Ís. Whoever keeps this hall crosses its pools on ice. Ask takes three.',
        sv: 'Ett ställ av ben håller runstavar ristade för Ís. Den som vaktar salen går över dess dammar på is. Ask tar tre.',
      },
    },
    {
      k: 'do',
      effects: [
        { k: 'give', item: 'stave_is', n: 3 },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
    },
  ],
};

/**
 * Past Náströnd's hall: the captives' chains have fallen, and Kolbeinn steps out of the fog to say what he
 * came to say.
 */
const d4Kolbeinn: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_d4_kolbeinn', value: true }] },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Far off in the cells, chains ring on stone and fall still. Ulf and Tófa are free, and already running for home.',
        sv: 'Långt borta i cellerna klingar kedjor mot sten och tystnar. Ulf och Tófa är fria, och springer redan hemåt.',
      },
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The fog by the far wall thickens into a shape: a cloaked man leaning on a seiðr-staff. Kolbeinn.',
        sv: 'Dimman vid den bortre väggen tätnar till en gestalt: en mantelklädd man som lutar sig mot en seidstav. Kolbeinn.',
      },
    },
    {
      k: 'say',
      who: 'kolbeinn',
      text: {
        en: 'Náströnd, gone. He never could keep his shield up. Three more, and you will have done my work for me.',
        sv: 'Náströnd, borta. Han kunde aldrig hålla skölden uppe. Tre till, och du har gjort mitt arbete åt mig.',
      },
    },
    {
      k: 'say',
      who: 'ask',
      text: { en: 'Where is Embla?', sv: 'Var är Embla?' },
    },
    {
      k: 'say',
      who: 'kolbeinn',
      text: {
        en: 'Ahead of you. She always was.',
        sv: 'Före dig. Det har hon alltid varit.',
      },
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The fog thins, and he is gone. The rune-stone by the wall hums: it knows the way back to the gate.',
        sv: 'Dimman tunnas ut, och han är borta. Runstenen vid väggen surrar: den kan vägen tillbaka till porten.',
      },
    },
  ],
};

/** The rune-stone behind Náströnd's hall takes Ask back out to Helgrind's gate. */
const d4GateOut: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'sfx', id: 'sfx_warp' }] },
    { k: 'fade', out: true },
    { k: 'warp', screen: 'nif_gate', at: { x: 20, y: 6 }, facing: 's' },
    { k: 'fade', out: false },
  ],
};

/** Through the bars of their cells in Helgrind: a word with Ulf, and with Tófa. */
const d4CellUlf: ScriptDef = { steps: [{ k: 'talk', dialogue: 'ulf', with: 'ulf' }] };
const d4CellTofa: ScriptDef = { steps: [{ k: 'talk', dialogue: 'tofa', with: 'tofa' }] };

/** Tófa's stall at the field fence: a word, then her flatbread and cheese. */
const shopTofa: ScriptDef = {
  steps: [
    { k: 'talk', dialogue: 'tofa', with: 'tofa' },
    { k: 'shop', id: 'tofa' },
  ],
};

/** Ulf's herding round: the flock scattered over the pasture, Ask by the gate, and a minute of sand. */
const ulfHerdStart: ScriptDef = {
  steps: [
    { k: 'fade', out: true },
    {
      k: 'do',
      effects: [
        { k: 'set', flag: 'ev_ulf_herd', value: false },
        { k: 'set', flag: 'q_ulf_penned', value: false },
        { k: 'set', flag: 'ev_ulf_round', value: true },
        { k: 'var', key: 'ulf_pen', value: 0 },
      ],
    },
    { k: 'warp', screen: 'ask_pasture', at: { x: 16, y: 10 }, facing: 'e' },
    { k: 'fade', out: false },
    {
      k: 'trial',
      ticks: HERD_TICKS,
      done: { k: 'flag', id: 'q_ulf_penned' },
      win: 'ulf_herd_won',
      fail: 'ulf_herd_lost',
    },
  ],
};

const ulfHerdWon: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'ev_ulf_round', value: false }] },
    {
      k: 'say',
      who: 'ulf',
      text: {
        en: 'All five, and sand to spare! Here, twenty silver. Halvar says a shepherd should pay his dogs.',
        sv: 'Alla fem, och sand över! Här, tjugo silver. Halvar säger att en herde ska betala sina hundar.',
      },
    },
    { k: 'do', effects: [{ k: 'silver', n: 20 }] },
  ],
};

const ulfHerdLost: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'ev_ulf_round', value: false }] },
    {
      k: 'say',
      who: 'ulf',
      text: {
        en: 'Sand’s out! They always go the other way. Again?',
        sv: 'Sanden är slut! De går alltid åt andra hållet. Igen?',
      },
    },
  ],
};

/** Helgrind (M6b), and the captives' homecomings to Askdalr. */
export const HELGRIND_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  d4_enter: d4Enter,
  d4_pedestal: d4Pedestal,
  d4_kolbeinn: d4Kolbeinn,
  d4_gate_out: d4GateOut,
  d4_cell_ulf: d4CellUlf,
  d4_cell_tofa: d4CellTofa,
  shop_tofa: shopTofa,
  ulf_herd_start: ulfHerdStart,
  ulf_herd_won: ulfHerdWon,
  ulf_herd_lost: ulfHerdLost,
};
