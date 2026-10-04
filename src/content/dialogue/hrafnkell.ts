import type { DialogueDef } from '@core/story/dialogue';
import { evening, flag, not } from './util';

/** Hrafnkell the trader: mead and horns across his counter by day, his own mead in the hall by night. */
export const HRAFNKELL: DialogueDef = {
  entry: [
    { when: not(flag('n_hrafnkell_met')), node: 'meet' },
    { when: evening, node: 'night' },
    { when: flag('st_pass_open'), node: 'fimbul' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'A customer! Hrafnkell, trader, at your service. Mead: red for the body, green for the other thing.',
        sv: 'En kund! Hrafnkell, handelsman, till din tjänst. Mjöd: rött för kroppen, grönt för det andra.',
      },
      do: [{ k: 'set', flag: 'n_hrafnkell_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'Mead needs a horn to carry it in. No horn, no mead. I have one spare, if silver is no object.',
        sv: 'Mjöd behöver ett horn att bäras i. Inget horn, inget mjöd. Jag har ett över, om silvret inte är något hinder.',
      },
    },
    day: {
      text: {
        en: 'Back again? Mead keeps, silver does not. What will it be?',
        sv: 'Tillbaka igen? Mjöd håller sig, silver gör det inte. Vad får det vara?',
      },
    },
    night: {
      text: {
        en: 'The shop is shut, friend. Come to the counter in the morning. Tonight I drink my own stock.',
        sv: 'Boden är stängd, min vän. Kom till disken i morgon. I kväll dricker jag mitt eget lager.',
      },
    },
    fimbul: {
      text: {
        en: 'Lamp oil and mead, that is all anyone buys now. Light and forgetting. I have stocked up on both.',
        sv: 'Lampolja och mjöd, det är allt någon köper nu. Ljus och glömska. Jag har fyllt på med båda.',
      },
    },
  },
};
