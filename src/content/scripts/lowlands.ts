import type { ScriptDef } from '@core/story/script';

/** A minute of sand for Hildr's herding. */
export const HERD_TICKS = 3600;

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

/** Hildr's herding begins: the flock scattered afresh, Ask beside her, and a minute of sand. */
const herdStart: ScriptDef = {
  steps: [
    { k: 'fade', out: true },
    {
      k: 'do',
      effects: [
        { k: 'set', flag: 'ev_herd_on', value: false },
        { k: 'set', flag: 'q_herd_penned', value: false },
        { k: 'var', key: 'hau_hurdles', value: 0 },
      ],
    },
    { k: 'warp', screen: 'hau_heath', at: { x: 17, y: 7 }, facing: 's' },
    { k: 'fade', out: false },
    {
      k: 'trial',
      ticks: HERD_TICKS,
      done: { k: 'flag', id: 'q_herd_penned' },
      win: 'herd_won',
      fail: 'herd_lost',
    },
  ],
};

const herdWon: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: 'hildr',
      text: {
        en: 'Six in the hurdles, and the sand still running! You have a shepherd’s legs. Here: my mother’s keepsake. It warms the heart, she said.',
        sv: 'Sex innanför gärdsgården, och sanden rinner fortfarande! Du har en herdes ben. Här: min mors minnessak. Den värmer hjärtat, sa hon.',
      },
    },
    {
      k: 'do',
      effects: [
        { k: 'set', flag: 'q_herd_done', value: true },
        { k: 'piece', id: 'hp_hau_heath' },
      ],
    },
  ],
};

const herdLost: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: 'hildr',
      text: {
        en: 'The sand is out, and they are all over the heath again. Catch your breath. Tell me when you want another go.',
        sv: 'Sanden är slut, och de är över hela heden igen. Hämta andan. Säg till när du vill försöka igen.',
      },
    },
  ],
};

/** The grave-ring laid back on its mound: its three wights rise. */
const ringLaid: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: null,
      text: {
        en: 'Ask lays the ring in the frost on the mound. The ground under it sighs.',
        sv: 'Ask lägger ringen i rimfrosten på högen. Marken under den suckar.',
      },
    },
    {
      k: 'do',
      effects: [
        { k: 'take', item: 'grave_ring' },
        { k: 'set', flag: 'q_ring_laid', value: true },
        { k: 'wake' },
      ],
    },
  ],
};

export const LOWLAND_SCRIPTS: Readonly<
  Record<'find_bell' | 'herd_start' | 'herd_won' | 'herd_lost' | 'ring_laid', ScriptDef>
> = {
  ring_laid: ringLaid,
  find_bell: findBell,
  herd_start: herdStart,
  herd_won: herdWon,
  herd_lost: herdLost,
};
