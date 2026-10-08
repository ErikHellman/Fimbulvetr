import type { DialogueDef } from '@core/story/dialogue';
import type { Effect } from '@core/story/effects';
import { flag } from './util';

/**
 * Urðr at the Norns' loom under the well (M7b, `q_loom`): she asks for three threads and weaves them into a
 * seiðr vessel, and from then on every hof can turn the year (`hof_season`).
 */
export const URDR: DialogueDef = {
  entry: [
    { when: flag('st_loom_woven'), node: 'done' },
    { when: { k: 'item', id: 'norn_thread', gte: 3 }, node: 'weave' },
    { node: 'ask' },
  ],
  nodes: {
    ask: {
      text: {
        en: 'The loom is short three threads, child of Askdalr. One hangs in Myrkviðr behind a web no blade cuts. One lies on the bottom of the ferry channel in Mýrland. One sleeps in the barrows and wakes only at night, for one who knows Ljós. Bring them.',
        sv: 'Vävstolen saknar tre trådar, barn av Askdalr. En hänger i Myrkviðr bakom en väv som ingen klinga skär. En ligger på botten av färjeleden i Mýrland. En sover bland gravhögarna och vaknar bara om natten, för den som kan Ljós. Hämta dem.',
      },
      do: [{ k: 'set', flag: 'q_loom_asked', value: true }],
    },
    weave: {
      text: {
        en: 'All three. Sit, and watch the shuttle. What was, what is, what shall be: there. Drink of it, and your seiðr runs deeper.',
        sv: 'Alla tre. Sitt, och se på skytteln. Det som var, det som är, det som ska bli: där. Drick av det, och din seiðr rinner djupare.',
      },
      do: [
        { k: 'take', item: 'norn_thread', n: 3 },
        { k: 'give', item: 'seidr_upgrade' },
        { k: 'set', flag: 'st_loom_woven', value: true },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
      next: 'season',
    },
    season: {
      text: {
        en: 'And one thing more. Kneel at any hof and pray, and the year will listen when you ask it to turn.',
        sv: 'Och en sak till. Knäfall vid vilket hov som helst och be, så lyssnar året när du ber det vända sig.',
      },
    },
    done: {
      text: {
        en: 'The cloth grows. Your thread is in it now, whether you like it or not.',
        sv: 'Tyget växer. Din tråd finns i det nu, vare sig du vill eller inte.',
      },
    },
  },
};

/** Verðandi, who spins what is. */
export const VERDANDI: DialogueDef = {
  entry: [{ when: flag('st_loom_woven'), node: 'woven' }, { node: 'spin' }],
  nodes: {
    spin: {
      text: {
        en: 'Do not stand on the thread. I spin what is, and what is, is cold. Talk to my sister: she keeps the count.',
        sv: 'Stå inte på tråden. Jag spinner det som är, och det som är, är kallt. Tala med min syster: hon håller räkningen.',
      },
    },
    woven: {
      text: {
        en: 'There, the winter thread runs thinner already. Not gone. Thinner.',
        sv: 'Så, vintertråden löper redan tunnare. Inte borta. Tunnare.',
      },
    },
  },
};

/** Skuld, who cuts what shall be, and says very little. */
export const SKULD: DialogueDef = {
  entry: [{ node: 'cut' }],
  nodes: {
    cut: {
      text: {
        en: 'Not yet.',
        sv: 'Inte än.',
      },
    },
  },
};

const turn = (season: 'spring' | 'summer' | 'autumn' | 'winter'): Effect[] => [
  { k: 'setSeason', season },
  { k: 'sfx', id: 'sfx_wind' },
];

/** After a prayer at a hof, once the loom is woven: the year turns to the season Ask asks for. */
export const HOF_SEASON: DialogueDef = {
  entry: [{ node: 'ask' }],
  nodes: {
    ask: {
      who: null,
      text: {
        en: 'The Norns’ thread hums in the stone. Ask the year to turn?',
        sv: 'Nornornas tråd surrar i stenen. Be året att vända sig?',
      },
      choices: [
        { text: { en: 'Spring', sv: 'Vår' }, do: turn('spring'), next: 'turned' },
        { text: { en: 'Summer', sv: 'Sommar' }, do: turn('summer'), next: 'turned' },
        { text: { en: 'Autumn', sv: 'Höst' }, do: turn('autumn'), next: 'turned' },
        { text: { en: 'Winter', sv: 'Vinter' }, do: turn('winter'), next: 'turned' },
        { text: { en: 'Leave it be', sv: 'Låt det vara' } },
      ],
    },
    turned: {
      who: null,
      text: {
        en: 'Wind goes through the hof, and outside the light has changed.',
        sv: 'En vind går genom hovet, och utanför har ljuset förändrats.',
      },
    },
  },
};
