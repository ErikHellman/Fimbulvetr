import type { ScriptDef } from '@core/story/script';
import type { ScriptId } from '../ids';

/** The first breath inside Sökkva Hof. */
const d5Enter: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_d5_entered', value: true }] },
    {
      k: 'say',
      who: 'ask',
      text: {
        en: 'Air, under the lake. The hof kept it, the way a drowned man keeps his last breath. Oddr and Hallbera are down here somewhere.',
        sv: 'Luft, under sjön. Hovet behöll den, som en drunknad behåller sitt sista andetag. Oddr och Hallbera finns här nere någonstans.',
      },
    },
  ],
};

/**
 * Past Nykr's pool: the captives' chains have fallen, and Kolbeinn speaks out of the water to say what he
 * came to say.
 */
const d5Kolbeinn: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_d5_kolbeinn', value: true }] },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Somewhere in the cells, chains ring on stone and fall still. Oddr and Hallbera are free, and already climbing for the air.',
        sv: 'Någonstans i cellerna klingar kedjor mot sten och tystnar. Oddr och Hallbera är fria, och klättrar redan upp mot luften.',
      },
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The water in the gutter by the wall stands up into a shape: a cloaked man leaning on a seiðr-staff. Kolbeinn.',
        sv: 'Vattnet i rännan vid väggen reser sig till en gestalt: en mantelklädd man som lutar sig mot en seidstav. Kolbeinn.',
      },
    },
    {
      k: 'say',
      who: 'kolbeinn',
      text: {
        en: 'Half his oath is water now. You will drown in the rest.',
        sv: 'Halva hans ed är vatten nu. Du kommer att drunkna i resten.',
      },
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The shape falls back into the gutter, and he is gone. The rune-stone by the wall hums: it knows the way up to the spire.',
        sv: 'Gestalten faller tillbaka i rännan, och han är borta. Runstenen vid väggen surrar: den kan vägen upp till spiran.',
      },
    },
  ],
};

/** The rune-stone behind Nykr's pool takes Ask back up to the drowned village, by the spire. */
const d5GateOut: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'sfx', id: 'sfx_warp' }] },
    { k: 'fade', out: true },
    { k: 'warp', screen: 'sae_drowned', at: { x: 16, y: 10 }, facing: 's' },
    { k: 'fade', out: false },
  ],
};

/** Through the bars of their cells in Sökkva Hof: a word with Oddr, and with Hallbera. */
const d5CellOddr: ScriptDef = { steps: [{ k: 'talk', dialogue: 'oddr', with: 'oddr' }] };
const d5CellHallbera: ScriptDef = { steps: [{ k: 'talk', dialogue: 'hallbera', with: 'hallbera' }] };

/** Hallbera's door: a word, then her red mead. */
const shopHallbera: ScriptDef = {
  steps: [
    { k: 'talk', dialogue: 'hallbera', with: 'hallbera' },
    { k: 'shop', id: 'hallbera' },
  ],
};

/** Oddr's skiff at Bárðr's landing rows Ask to Sævatn's near landing, while the lake is open. */
const oddrSkiff: ScriptDef = {
  steps: [
    {
      k: 'if',
      when: { k: 'season', is: 'winter' },
      then: [
        {
          k: 'say',
          who: null,
          text: {
            en: 'Oddr’s skiff is drawn up on the sand. Out past the warm channel the lake is ice.',
            sv: 'Oddrs eka är uppdragen på sanden. Bortom den varma rännan är sjön is.',
          },
        },
      ],
      else: [
        {
          k: 'say',
          who: null,
          text: {
            en: 'Oddr’s skiff, new pine, with TROLL-PROOF cut into the thwart. Ask pushes off and rows for the far shore.',
            sv: 'Oddrs eka, ny furu, med TROLLSÄKER inristat i toften. Ask stöter ut och ror mot andra stranden.',
          },
        },
        { k: 'fade', out: true },
        { k: 'wait', ticks: 40 },
        { k: 'warp', screen: 'sae_landing', at: { x: 17, y: 10 }, facing: 'e' },
        { k: 'fade', out: false },
      ],
    },
  ],
};

export const D5_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  d5_enter: d5Enter,
  d5_kolbeinn: d5Kolbeinn,
  d5_gate_out: d5GateOut,
  d5_cell_oddr: d5CellOddr,
  d5_cell_hallbera: d5CellHallbera,
  shop_hallbera: shopHallbera,
  oddr_skiff: oddrSkiff,
};
