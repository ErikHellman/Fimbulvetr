import type { ScriptDef } from '@core/story/script';
import type { ScriptId } from '../ids';

/** The first breath of Ívaldi's Forge (M8b). */
const d6Enter: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_d6_entered', value: true }] },
    {
      k: 'say',
      who: 'ask',
      text: {
        en: 'The air is an oven’s breath, and somewhere deep down a hammer rings, slow as a heart. Þorkell and Rannveig are in here somewhere.',
        sv: 'Luften är som en ugns andedräkt, och någonstans långt nere klingar en hammare, långsamt som ett hjärta. Þorkell och Rannveig finns här inne någonstans.',
      },
    },
  ],
};

/** Past Ívaldi's anvil: the captives' chains fall, and Kolbeinn speaks out of the forge-smoke. */
const d6Kolbeinn: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_d6_kolbeinn', value: true }] },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Somewhere in the cells, chains ring on stone and fall still. Þorkell and Rannveig are free, and already on the road home.',
        sv: 'Någonstans i cellerna klingar kedjor mot sten och tystnar. Þorkell och Rannveig är fria, och redan på väg hem.',
      },
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The smoke over the cold forge gathers into a shape: a cloaked man leaning on a seiðr-staff. Kolbeinn.',
        sv: 'Röken över den kalla smedjan samlas till en gestalt: en mantelklädd man som lutar sig mot en seidstav. Kolbeinn.',
      },
    },
    {
      k: 'say',
      who: 'kolbeinn',
      text: {
        en: 'One left in the ice. Do you know what you are freeing, farmhand?',
        sv: 'En kvar i isen. Vet du vad det är du befriar, drängpojke?',
      },
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The smoke thins, and he is gone. The rune-stone behind the anvil hums: it knows the way out to the forge gate.',
        sv: 'Röken tunnas ut, och han är borta. Runstenen bakom städet surrar: den kan vägen ut till smedjeporten.',
      },
    },
  ],
};

/** The rune-stone behind Ívaldi's anvil takes Ask out to the forge gate. */
const d6GateOut: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'sfx', id: 'sfx_warp' }] },
    { k: 'fade', out: true },
    { k: 'warp', screen: 'dvg_forgegate', at: { x: 19, y: 8 }, facing: 's' },
    { k: 'fade', out: false },
  ],
};

/** Through the bars of their cells in Ívaldi's Forge: a word with Þorkell, and with Rannveig. */
const d6CellThorkell: ScriptDef = { steps: [{ k: 'talk', dialogue: 'thorkell', with: 'thorkell' }] };
const d6CellRannveig: ScriptDef = { steps: [{ k: 'talk', dialogue: 'rannveig', with: 'rannveig' }] };

/** Rannveig's door: a word, then her arrows and bombs. */
const shopRannveig: ScriptDef = {
  steps: [
    { k: 'talk', dialogue: 'rannveig', with: 'rannveig' },
    { k: 'shop', id: 'rannveig' },
  ],
};

export const D6_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  d6_enter: d6Enter,
  d6_kolbeinn: d6Kolbeinn,
  d6_gate_out: d6GateOut,
  d6_cell_thorkell: d6CellThorkell,
  d6_cell_rannveig: d6CellRannveig,
  shop_rannveig: shopRannveig,
};
