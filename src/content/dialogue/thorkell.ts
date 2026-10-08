import type { DialogueDef } from '@core/story/dialogue';
import { all, atLeast, daily, flag, not } from './util';

/** Ore for the goat-house and the goats: farm stage 3 (M8b). */
const BYRE = 10;

/** Þorkell, the neighbour, before the raid. */
const DAYS: DialogueDef = daily(
  [
    {
      en: 'Halvar is lucky to have you, lad. My sons left for Uppvík and never looked back.',
      sv: 'Halvar har tur som har dig, pojk. Mina söner drog till Uppvík och såg sig aldrig om.',
    },
  ],
  [
    {
      en: 'The road north is quiet. Too quiet, Grímr says. Grímr says a lot.',
      sv: 'Vägen norrut är tyst. För tyst, säger Grímr. Grímr säger en hel del.',
    },
  ],
  [
    {
      en: 'Rannveig wants me to bar the door tonight. Women’s fears.',
      sv: 'Rannveig vill att jag bommar dörren i natt. Kvinnofruktan.',
    },
  ],
  { en: 'Rannveig! Rannveig, where are you?', sv: 'Rannveig! Rannveig, var är du?' },
);

/**
 * Þorkell: taken in the raid, held in a cell in Ívaldi's Forge until Ívaldi falls (M8b), then home. He
 * learned iron-work at the dwarves' forges, and for ten lumps of ore he raises Halvar a goat-house and
 * brings goats to it (`q_farm` 3).
 */
export const THORKELL: DialogueDef = {
  entry: [
    { when: atLeast('q_farm', 3), node: 'goats' },
    { when: all(flag('st_freed_thorkell'), atLeast('q_farm', 2)), node: 'byre' },
    { when: flag('st_freed_thorkell'), node: 'home' },
    { when: flag('st_raid_done'), node: 'cell' },
    ...DAYS.entry,
  ],
  nodes: {
    ...DAYS.nodes,
    cell: {
      text: {
        en: 'Lad! They have me at the bellows, day and night. My arms are iron by now. Is Rannveig safe?',
        sv: 'Pojk! De har mig vid blåsbälgen, dag och natt. Mina armar är av järn vid det här laget. Är Rannveig oskadd?',
      },
      next: 'cell_where',
    },
    cell_where: {
      text: {
        en: 'She is in the next cell west. The king with the hammer keeps the keys on his belt. Break him, and the chains go with him.',
        sv: 'Hon sitter i nästa cell västerut. Kungen med hammaren har nycklarna i bältet. Krossa honom, så går kedjorna med honom.',
      },
    },
    home: {
      text: {
        en: 'Home, and Rannveig with me. I owe you more than I can say, lad. When Halvar has his fold up again, come and see me.',
        sv: 'Hemma, och Rannveig med mig. Jag är skyldig dig mer än jag kan säga, pojk. När Halvar har fått upp fållan igen, kom och hälsa på.',
      },
    },
    byre: {
      text: {
        en: `I learned iron down there whether I liked it or not. Bring me ${String(BYRE)} lumps of black ore and I will raise Halvar a goat-house, iron-shod, and find him goats for it.`,
        sv: `Jag lärde mig järn där nere vare sig jag ville eller inte. Ge mig ${String(BYRE)} klumpar svart malm så reser jag ett gethus åt Halvar, järnskott, och skaffar getter till det.`,
      },
      choices: [
        {
          text: { en: `Give ${String(BYRE)} ore.`, sv: `Ge ${String(BYRE)} malm.` },
          when: { k: 'item', id: 'ore', gte: BYRE },
          do: [
            { k: 'take', item: 'ore', n: BYRE },
            { k: 'set', flag: 'q_farm', value: 3 },
            { k: 'sfx', id: 'sfx_buy' },
          ],
          next: 'byre_done',
        },
        {
          text: { en: 'Not yet.', sv: 'Inte än.' },
          when: not({ k: 'item', id: 'ore', gte: BYRE }),
        },
        { text: { en: 'Later.', sv: 'Senare.' }, when: { k: 'item', id: 'ore', gte: BYRE } },
      ],
    },
    byre_done: {
      text: {
        en: 'Good dwarf ore. By the next full moon there will be a goat-house on the farm, and goats in it, and Halvar complaining about the goats.',
        sv: 'God dvärgmalm. Till nästa fullmåne står det ett gethus på gården, med getter i, och Halvar som klagar på getterna.',
      },
    },
    goats: {
      text: {
        en: 'Have you seen the goats? I named them. Rannveig says I should not have named them.',
        sv: 'Har du sett getterna? Jag har döpt dem. Rannveig säger att jag inte borde ha döpt dem.',
      },
    },
  },
};
