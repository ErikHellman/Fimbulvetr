import type { DialogueDef } from '@core/story/dialogue';
import { flag, not } from './util';

/** Jórunn the weaver hears everything said on the square, and repeats most of it. */
export const JORUNN: DialogueDef = {
  entry: [
    { when: not(flag('n_jorunn_met')), node: 'meet' },
    { when: { k: 'item', id: 'trade_fleece' }, node: 'fleece' },
    { when: { k: 'weather', is: ['rain', 'storm'] }, node: 'rain' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Oh, a stranger! I am Jórunn, I weave. And I hear everything, so you may as well tell me your name now.',
        sv: 'Åh, en främling! Jag är Jórunn, jag väver. Och jag hör allt, så du kan lika gärna säga ditt namn nu.',
      },
      do: [{ k: 'set', flag: 'n_jorunn_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'Askdalr? Raided? By trolls? Oh, the poor souls. Give me an hour and the whole square will know.',
        sv: 'Askdalr? Plundrat? Av troll? Åh, de stackarna. Ge mig en timme så vet hela torget.',
      },
    },
    fleece: {
      text: {
        en: 'Is that Hildr’s fleece? Nobody else on the heath shears that clean. Give it here; my wheel has had nothing to do since the cold came.',
        sv: 'Är det Hildrs fäll? Ingen annan på heden klipper så rent. Ge hit den; min slända har inte haft något att göra sedan kölden kom.',
      },
      choices: [
        {
          text: { en: 'Have her spin it.', sv: 'Låt henne spinna den.' },
          do: [
            { k: 'take', item: 'trade_fleece' },
            { k: 'give', item: 'trade_yarn' },
            { k: 'set', flag: 'q_trade', value: 2 },
            { k: 'sfx', id: 'sfx_itemget' },
          ],
          next: 'yarn',
        },
        { text: { en: 'Not yet.', sv: 'Inte än.' } },
      ],
    },
    yarn: {
      text: {
        en: 'There, good strong yarn. Too coarse for a cloak, mind; it would do for nets. Old Kári down in Mýrland is always mending his.',
        sv: 'Så, gott starkt garn. För grovt till en mantel, märk väl; det duger till nät. Gamle Kári nere i Mýrland lagar alltid sina.',
      },
    },
    day: {
      text: {
        en: 'Glúmr lost his boots at dice again. Ketill’s apprentice ran off. Hrafnkell waters the mead. You heard it here.',
        sv: 'Glúmr spelade bort stövlarna igen. Ketills lärling har rymt. Hrafnkell spär ut mjödet. Du hörde det här först.',
      },
    },
    rain: {
      text: {
        en: 'Too wet for the loom outside. Hrafnkell lets me sit here as long as I say nothing about the mead.',
        sv: 'För blött för vävstolen ute. Hrafnkell låter mig sitta här så länge jag inte säger något om mjödet.',
      },
    },
  },
};
