import type { DialogueDef } from '@core/story/dialogue';
import { flag, not } from './util';

/** Jórunn the weaver hears everything said on the square, and repeats most of it. */
export const JORUNN: DialogueDef = {
  entry: [
    { when: not(flag('n_jorunn_met')), node: 'meet' },
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
