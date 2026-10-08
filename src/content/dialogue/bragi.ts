import type { DChoice, DialogueDef, DNode } from '@core/story/dialogue';
import { VERSE_PRICE, VERSES } from '../verses';
import { all, flag, not } from './util';

const rich = { k: 'silver', gte: VERSE_PRICE } as const;
const poor = { k: 'not', c: rich } as const;
const allSung = all(...VERSES.map((v) => flag(v.flag)));

/** One node per verse: Bragi sings it, and the map remembers it. */
const sung: Record<string, DNode> = Object.fromEntries(
  VERSES.map((v) => [v.flag, { text: v.text, next: 'kept' } satisfies DNode]),
);

/**
 * Bragi, the wandering skald, by his fire in the drained camp from evening to dawn. He sells verses for
 * silver; each one marks a secret on the pause map (`content/verses.ts`). More verses come in later acts.
 */
export const BRAGI: DialogueDef = {
  entry: [
    { when: not(flag('n_bragi_met')), node: 'meet' },
    { when: allSung, node: 'done' },
    { node: 'menu' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Sit, if you are not one of them. Bragi, a skald with no hall left to sing in. The fog keeps its secrets, but I have walked it long enough to put a few in verse.',
        sv: 'Sätt dig, om du inte är en av dem. Bragi, en skald utan någon hall kvar att sjunga i. Dimman håller sina hemligheter, men jag har vandrat i den länge nog för att sätta några på vers.',
      },
      do: [{ k: 'set', flag: 'n_bragi_met', value: true }],
      next: 'menu',
    },
    menu: {
      text: {
        en: `A verse for ${String(VERSE_PRICE)} silver. Keep it in mind, and your map will keep it too.`,
        sv: `En vers för ${String(VERSE_PRICE)} silver. Håll den i minnet, så håller din karta den också.`,
      },
      choices: [
        ...VERSES.map((v, i): DChoice => ({
          text: {
            en: `Sing me a verse (${String(VERSE_PRICE)} silver).`,
            sv: `Sjung en vers för mig (${String(VERSE_PRICE)} silver).`,
          },
          // Only the first verse not yet bought is on offer, so the choice list stays one line long.
          when: all(rich, not(flag(v.flag)), ...VERSES.slice(0, i).map((w) => flag(w.flag))),
          do: [
            { k: 'silver', n: -VERSE_PRICE },
            { k: 'set', flag: v.flag, value: true },
          ],
          next: v.flag,
        })),
        {
          text: {
            en: `A verse (${String(VERSE_PRICE)} silver)…`,
            sv: `En vers (${String(VERSE_PRICE)} silver)…`,
          },
          when: all(poor, not(allSung)),
          next: 'poor',
        },
        { text: { en: 'Another night.', sv: 'En annan natt.' }, next: 'bye' },
      ],
    },
    ...sung,
    kept: {
      text: {
        en: 'There. It is yours now; I only lend them.',
        sv: 'Så. Nu är den din; jag lånar bara ut dem.',
      },
    },
    poor: {
      text: {
        en: 'A skald must eat, even here. Come back with silver; the verses will wait.',
        sv: 'En skald måste äta, även här. Kom tillbaka med silver; verserna väntar.',
      },
    },
    bye: {
      text: {
        en: 'Mind the lights over the water. They are not lanterns.',
        sv: 'Akta dig för ljusen över vattnet. De är inga lyktor.',
      },
    },
    done: {
      text: {
        en: 'You have all I know of this marsh. Further north there will be more to sing, if any of us live to sing it.',
        sv: 'Du har allt jag vet om det här kärret. Längre norrut finns det mer att sjunga om, om någon av oss lever för att sjunga det.',
      },
    },
  },
};
