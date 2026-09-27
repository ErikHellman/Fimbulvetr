import type { DialogueDef } from '@core/story/dialogue';
import { evening, flag, not } from './util';

/** Dagný the huntress, at her fire by the Myrkviðr road. */
export const DAGNY: DialogueDef = {
  entry: [
    { when: not(flag('n_dagny_met')), node: 'meet' },
    { when: evening, node: 'night' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Quiet, you will scare off everything worth eating. You are from Askdalr? I saw the fires from here.',
        sv: 'Tyst, du skrämmer bort allt som går att äta. Är du från Askdalr? Jag såg eldarna härifrån.',
      },
      do: [{ k: 'set', flag: 'n_dagny_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'The vargar on this road crouch before they spring. Step aside, then strike while they stand there panting.',
        sv: 'Vargarna på den här vägen hukar sig innan de hoppar. Kliv åt sidan och hugg medan de står där och flämtar.',
      },
    },
    day: {
      text: {
        en: 'Three kills since dawn, and the pack still grows. Something is driving them south from the mountains.',
        sv: 'Tre fällda sedan gryningen, och flocken växer ändå. Något driver dem söderut från bergen.',
      },
    },
    night: {
      text: {
        en: 'Sit by the fire if you like. Keep your back to the light and your eyes on the dark.',
        sv: 'Sätt dig vid elden om du vill. Håll ryggen mot ljuset och ögonen mot mörkret.',
      },
    },
  },
};
