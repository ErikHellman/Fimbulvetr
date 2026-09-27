import type { DialogueDef } from '@core/story/dialogue';
import { flag, not } from './util';

/** Hjalti, a town boy, runs circles round the well. */
export const HJALTI: DialogueDef = {
  entry: [{ when: not(flag('n_hjalti_met')), node: 'meet' }, { node: 'day' }],
  nodes: {
    meet: {
      text: {
        en: 'Are you a warrior? You have a blade! I am Hjalti. When I am big I will fight the Rime King myself.',
        sv: 'Är du en krigare? Du har en klinga! Jag är Hjalti. När jag blir stor ska jag slåss mot Rimkungen själv.',
      },
      do: [{ k: 'set', flag: 'n_hjalti_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'Mother says he is only a story. But then why does she bar the door at night?',
        sv: 'Mor säger att han bara är en saga. Men varför bommar hon då dörren om natten?',
      },
    },
    day: {
      text: {
        en: 'The huldra takes children who run off into the woods, Jórunn says. I do not believe it. Mostly.',
        sv: 'Huldran tar barn som springer bort i skogen, säger Jórunn. Det tror jag inte på. Nästan inte.',
      },
    },
  },
};
