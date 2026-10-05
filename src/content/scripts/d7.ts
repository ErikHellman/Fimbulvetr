import type { ScriptDef } from '@core/story/script';
import type { ScriptId } from '../ids';

/** The first breath of Hrímturn (M9b). */
const d7Enter: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_d7_entered', value: true }] },
    {
      k: 'say',
      who: 'ask',
      text: {
        en: 'Inside, the cold is still, and the light comes through the walls in shafts. Ása and Bjarni are up here somewhere, in all this glass.',
        sv: 'Härinne står kylan stilla, och ljuset faller genom väggarna i strålar. Ása och Bjarni är här uppe någonstans, i allt detta glas.',
      },
    },
  ],
};

/** Past Hrímgerðr: the captives' chains fall, and Kolbeinn speaks out of the settling rime. */
const d7Kolbeinn: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_d7_kolbeinn', value: true }] },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Down in the cells, the bars ring and shatter like icicles. Ása and Bjarni are free. Everyone taken in the raid is going home.',
        sv: 'Nere i cellerna klingar gallren och splittras som istappar. Ása och Bjarni är fria. Alla som togs i räden är på väg hem.',
      },
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The rime-dust over the hall gathers into a shape: a cloaked man leaning on a seiðr-staff. Kolbeinn.',
        sv: 'Rimdammet över salen samlas till en gestalt: en mantelklädd man som lutar sig mot en seidstav. Kolbeinn.',
      },
    },
    {
      k: 'say',
      who: 'kolbeinn',
      text: {
        en: 'All four. Then there is only the King, and me. Come to Útgarðr, farmhand.',
        sv: 'Alla fyra. Då återstår bara Kungen, och jag. Kom till Útgarðr, drängpojke.',
      },
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The dust falls, and he is gone. The rune-stone behind her place hums: it knows the way down to the tower’s foot.',
        sv: 'Dammet faller, och han är borta. Runstenen bakom hennes plats surrar: den kan vägen ner till tornets fot.',
      },
    },
  ],
};

/** The rune-stone behind Hrímgerðr's place takes Ask down to the tower's foot. */
const d7GateOut: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'sfx', id: 'sfx_warp' }] },
    { k: 'fade', out: true },
    { k: 'warp', screen: 'hrf_towerfoot', at: { x: 19, y: 9 }, facing: 's' },
    { k: 'fade', out: false },
  ],
};

/** Through the bars of their cells in Hrímturn: a word with Ása, and with Bjarni. */
const d7CellAsa: ScriptDef = { steps: [{ k: 'talk', dialogue: 'asa', with: 'asa' }] };
const d7CellBjarni: ScriptDef = { steps: [{ k: 'talk', dialogue: 'bjarni', with: 'bjarni' }] };

/** A basin of meltwater, dripping from the tower's roof: Ask drinks, and is whole again. */
const d7Basin: ScriptDef = {
  steps: [
    {
      k: 'do',
      effects: [
        { k: 'heal', n: 80 },
        { k: 'sfx', id: 'sfx_drink' },
      ],
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Meltwater, dripping from the roof into a basin cut in the ice. It tastes of nothing at all, and every hurt goes quiet.',
        sv: 'Smältvatten som droppar från taket ner i en skål huggen i isen. Det smakar ingenting alls, och varje sår tystnar.',
      },
    },
  ],
};

export const D7_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  d7_enter: d7Enter,
  d7_kolbeinn: d7Kolbeinn,
  d7_gate_out: d7GateOut,
  d7_cell_asa: d7CellAsa,
  d7_cell_bjarni: d7CellBjarni,
  d7_basin: d7Basin,
};
