import type { DialogueDef } from '@core/story/dialogue';
import { all, evening, flag, not } from './util';

/** Dagný the huntress, at her fire by the Myrkviðr road. */
export const DAGNY: DialogueDef = {
  entry: [
    { when: not(flag('n_dagny_met')), node: 'meet' },
    { when: all(flag('q_vargar_taken'), not(flag('q_vargar_alpha'))), node: 'hunt' },
    { when: flag('q_vargar_alpha'), node: 'hunted' },
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
    hunt: {
      text: {
        en: 'Bersi’s bounty? The leader is black as soot, white at the throat. It stands and howls, and the pack comes running.',
        sv: 'Bersis belöning? Ledaren är svart som sot, vit om strupen. Den står still och ylar, och flocken kommer springande.',
      },
      do: [{ k: 'set', flag: 'q_vargar_tracked', value: true }],
      next: 'hunt2',
    },
    hunt2: {
      text: {
        en: 'Strike it while it howls and none will come. And do not block its lunge; it will knock you flat. Roll.',
        sv: 'Hugg den medan den ylar så kommer ingen. Och parera inte dess språng, det slår omkull dig. Rulla undan.',
      },
    },
    hunted: {
      text: {
        en: 'You killed the black one? The road will be quieter for a while. Not for long, with winter coming.',
        sv: 'Fällde du den svarta? Vägen blir lugnare ett tag. Inte länge, med vintern på väg.',
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
