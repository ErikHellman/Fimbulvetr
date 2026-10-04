import type { ScriptDef } from '@core/story/script';

/** Forty-five seconds of sand at Ketill's axe range. */
export const AXES_TICKS = 2700;

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

/** The wild bees' hive in the pines: honey for Þórdís in summer or autumn, if the lantern smokes the bees. */
const hive: ScriptDef = {
  steps: [
    {
      k: 'if',
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'q_honey_asked' },
          { k: 'not', c: { k: 'flag', id: 'q_honey_done' } },
          { k: 'not', c: { k: 'item', id: 'honey' } },
        ],
      },
      then: [
        {
          k: 'if',
          when: {
            k: 'any',
            of: [
              { k: 'season', is: 'summer' },
              { k: 'season', is: 'autumn' },
            ],
          },
          then: [
            {
              k: 'if',
              when: { k: 'owns', id: 'lantern' },
              then: [
                {
                  k: 'say',
                  who: null,
                  text: {
                    en: 'Ask holds the lantern under the hive. The smoke makes the bees drowsy, and a slab of comb comes away.',
                    sv: 'Ask håller lyktan under kupan. Röken gör bina dåsiga, och en kaka vax lossnar.',
                  },
                },
                {
                  k: 'do',
                  effects: [
                    { k: 'give', item: 'honey' },
                    { k: 'sfx', id: 'sfx_itemget' },
                  ],
                },
              ],
              else: [
                {
                  k: 'say',
                  who: null,
                  text: {
                    en: 'The bees boil out of the hive, furious. Without smoke to calm them, nobody gets near the comb.',
                    sv: 'Bina väller ut ur kupan, rasande. Utan rök som lugnar dem kommer ingen nära vaxkakan.',
                  },
                },
              ],
            },
          ],
          else: [
            {
              k: 'say',
              who: null,
              text: {
                en: 'The bees are balled up asleep in the cold, the comb frozen hard. Come back in summer or autumn.',
                sv: 'Bina sover i en klunga i kylan, och kakan är frusen hård. Kom tillbaka på sommaren eller hösten.',
              },
            },
          ],
        },
      ],
      else: [
        {
          k: 'say',
          who: null,
          text: {
            en: 'A wild bees’ hive, high in the pine. Better left alone.',
            sv: 'En vildbikupa, högt uppe i tallen. Bäst att låta den vara.',
          },
        },
      ],
    },
  ],
};

const TARGETS = ['q_axe_t1', 'q_axe_t2', 'q_axe_t3', 'q_axe_t4', 'q_axe_t5'] as const;

/** Ketill's range: the targets reset, the axes back on the rack, and the sand turned. */
const axesStart: ScriptDef = {
  steps: [
    { k: 'fade', out: true },
    {
      k: 'do',
      effects: [
        { k: 'set', flag: 'ev_axes_on', value: false },
        { k: 'set', flag: 'q_axes_hit', value: 0 },
        ...TARGETS.map((flag) => ({ k: 'set' as const, flag, value: false })),
      ],
    },
    { k: 'warp', screen: 'upp_smiths', at: { x: 13, y: 19 }, facing: 'e' },
    { k: 'fade', out: false },
    {
      k: 'trial',
      ticks: AXES_TICKS,
      done: { k: 'flag', id: 'q_axes_hit', gte: 5 },
      win: 'axes_won',
      fail: 'axes_lost',
    },
  ],
};

const axesWon: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: 'ketill',
      text: {
        en: 'Five for five, and sand to spare! My old apprentice never managed three. Here, this was meant for a better prize than him.',
        sv: 'Fem av fem, och sand över! Min gamla lärling klarade aldrig tre. Här, det här var tänkt som pris åt någon bättre än han.',
      },
    },
    {
      k: 'do',
      effects: [
        { k: 'set', flag: 'q_axes_done', value: true },
        { k: 'piece', id: 'hp_upp_range' },
      ],
    },
  ],
};

const axesLost: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: 'ketill',
      text: {
        en: 'Sand’s out. Not bad for a farmhand, not good for an axe-thrower. Again, whenever you like.',
        sv: 'Sanden är slut. Inte illa för en dräng, inte bra för en yxkastare. Igen, när du vill.',
      },
    },
  ],
};

export const LOWLAND_SCRIPTS: Readonly<
  Record<
    | 'find_bell'
    | 'herd_start'
    | 'herd_won'
    | 'herd_lost'
    | 'ring_laid'
    | 'hive'
    | 'axes_start'
    | 'axes_won'
    | 'axes_lost',
    ScriptDef
  >
> = {
  axes_start: axesStart,
  axes_won: axesWon,
  axes_lost: axesLost,
  hive,
  ring_laid: ringLaid,
  find_bell: findBell,
  herd_start: herdStart,
  herd_won: herdWon,
  herd_lost: herdLost,
};
