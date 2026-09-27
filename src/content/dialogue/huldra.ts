import type { DialogueDef } from '@core/story/dialogue';
import { flag, not } from './util';

/** The huldra of the birch glade, at night: a winter cloak for an unnamed promise. */
export const HULDRA: DialogueDef = {
  entry: [
    { when: flag('q_huldra_promise'), node: 'promised' },
    { when: flag('q_huldra_refused'), node: 'again' },
    { when: not(flag('n_huldra_met')), node: 'meet' },
    { node: 'offer' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'You walk softly for a farm lad. Sit with me a while. The birches listen, but they never tell.',
        sv: 'Du går tyst för att vara en gårdspojke. Sitt hos mig en stund. Björkarna lyssnar, men de skvallrar aldrig.',
      },
      do: [{ k: 'set', flag: 'n_huldra_met', value: true }],
      next: 'offer',
    },
    offer: {
      text: {
        en: 'Winter is coming for you, Ask. I see it on your breath. I have a cloak that no snow can bite through.',
        sv: 'Vintern kommer för dig, Ask. Jag ser den i din andedräkt. Jag har en kappa som ingen snö kan bita i.',
      },
      next: 'offer2',
    },
    offer2: {
      text: {
        en: 'It is yours, for a promise. Nothing now. Only a promise, kept when I come to ask. Will you give it?',
        sv: 'Den är din, mot ett löfte. Ingenting nu. Bara ett löfte, som hålls när jag kommer och ber. Ger du det?',
      },
      choices: [
        { text: { en: 'I promise.', sv: 'Jag lovar.' }, next: 'promise' },
        { text: { en: 'I will not.', sv: 'Det gör jag inte.' }, next: 'refuse' },
      ],
    },
    promise: {
      text: {
        en: 'Then it is sworn. Wrap yourself well, Ask. And remember: I always come to collect.',
        sv: 'Då är det svuret. Svep in dig väl, Ask. Och minns: jag kommer alltid för att hämta mitt.',
      },
      do: [
        { k: 'give', item: 'winter_cloak' },
        { k: 'set', flag: 'q_huldra_promise', value: true },
      ],
    },
    refuse: {
      text: {
        en: 'Wise, or only cold? Another night, then. The birches and I are patient.',
        sv: 'Klok, eller bara kall? En annan natt, då. Björkarna och jag har tålamod.',
      },
      do: [{ k: 'set', flag: 'q_huldra_refused', value: true }],
    },
    again: {
      text: {
        en: 'Back again, Ask? The cloak is still here, and so is the price. One promise.',
        sv: 'Tillbaka igen, Ask? Kappan finns kvar, och priset likaså. Ett löfte.',
      },
      next: 'offer2',
    },
    promised: {
      text: {
        en: 'Warm enough? Good. I have not forgotten your promise. Neither should you.',
        sv: 'Varm nog? Bra. Jag har inte glömt ditt löfte. Det ska inte du heller.',
      },
    },
  },
};
