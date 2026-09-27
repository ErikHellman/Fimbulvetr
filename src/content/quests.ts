import type { QuestDef } from '@core/story/quests';
import { afterRaid, all, atLeast, choresDone, day, eve, flag, paid } from './dialogue/util';
import type { QuestId } from './ids';

const home = { en: 'Evening. Go home to the longhouse.', sv: 'Kväll. Gå hem till långhuset.' };
const sleep = { en: 'Sleep. There will be more work tomorrow.', sv: 'Sov. I morgon blir det mer arbete.' };
const tell = { en: 'Tell Halvar the work is done.', sv: 'Berätta för Halvar att arbetet är gjort.' };

/** Quest definitions. Stages are derived from flags; the last one whose condition holds is current. */
export const QUEST_DEFS: Readonly<Partial<Record<QuestId, QuestDef>>> = {
  q_chores: {
    id: 'q_chores',
    name: { en: 'Farm chores', sv: 'Sysslor på gården' },
    stages: [
      {
        when: atLeast('st_farm_day', 1),
        text: { en: 'Pen the five sheep and fill the trough.', sv: 'Driv in de fem fåren och fyll tråget.' },
      },
      { when: all(day(1), choresDone(1)), text: tell },
      { when: flag(paid(1)), text: home },
      { when: flag(eve(1)), text: sleep },
      {
        when: atLeast('st_farm_day', 2),
        text: { en: 'Split the firewood by the chopping block.', sv: 'Klyv veden vid huggkubben.' },
      },
      { when: all(day(2), choresDone(2)), text: tell },
      { when: flag(paid(2)), text: home },
      { when: flag(eve(2)), text: sleep },
      {
        when: atLeast('st_farm_day', 3),
        text: { en: 'Drive the ravens off the barley.', sv: 'Jaga bort korparna från kornet.' },
      },
      { when: all(day(3), choresDone(3)), text: tell },
      { when: flag(paid(3)), text: home },
      { when: flag(eve(3)), text: sleep },
      {
        when: flag('st_raid_begun'),
        text: { en: 'A horn in the night. Something is wrong.', sv: 'Ett horn i natten. Något är fel.' },
      },
    ],
  },
  q_legend: {
    id: 'q_legend',
    name: { en: 'The raid', sv: 'Räden' },
    stages: [
      {
        when: afterRaid,
        text: { en: 'Halvar is asking for you.', sv: 'Halvar frågar efter dig.' },
      },
      {
        when: flag('st_seax_given'),
        text: { en: 'Go to the hof and hear what Gyða knows.', sv: 'Gå till hovet och hör vad Gyða vet.' },
      },
      {
        when: flag('st_legend_told'),
        text: {
          en: 'Kolbeinn took Embla and eight villagers for the Rime King.',
          sv: 'Kolbeinn tog Embla och åtta bybor åt Rimkungen.',
        },
      },
    ],
  },
  q_runestone_1: {
    id: 'q_runestone_1',
    name: { en: 'The first runestone', sv: 'Den första runstenen' },
    stages: [
      {
        when: flag('st_legend_told'),
        text: {
          en: 'Find Rótarhellir, the root cave in Myrkviðr, and light the first runestone again.',
          sv: 'Hitta Rótarhellir, rotgrottan i Myrkviðr, och tänd den första runstenen igen.',
        },
      },
      {
        when: flag('st_d1_entered'),
        text: {
          en: 'Find a way down through the roots of Rótarhellir to whatever keeps the stone dark.',
          sv: 'Hitta en väg ner genom Rótarhellirs rötter till det som håller stenen mörk.',
        },
      },
      {
        when: flag('st_d1_boss_dead'),
        text: {
          en: 'Rótvættr is dead. Lay a hand on the runestone behind its lair.',
          sv: 'Rótvættr är död. Lägg handen på runstenen bakom dess lya.',
        },
      },
      {
        when: flag('st_stone1_lit'),
        text: {
          en: 'The first runestone burns again. Two remain dark.',
          sv: 'Den första runstenen brinner igen. Två är fortfarande mörka.',
        },
      },
    ],
  },
};
