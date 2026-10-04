import type { DialogueDef } from '@core/story/dialogue';
import { all, flag, not } from './util';

/** What Bárðr asks to row Ask over to Sævatn's far landing. The way back is free. */
export const FERRY_FARE = 10;

const WINTER = { k: 'season', is: 'winter' } as const;

/**
 * Bárðr the ferryman rows nobody toward the mountains. Once the pass opens he rows Ask to Sævatn's far
 * landing in spring, summer and autumn (`bardr_ferry`, from his boat); in winter the lake is ice.
 */
export const BARDR: DialogueDef = {
  entry: [
    { when: not(flag('n_bardr_met')), node: 'meet' },
    { when: all(flag('st_pass_open'), WINTER), node: 'frozen' },
    { when: flag('st_pass_open'), node: 'ferry' },
    { when: WINTER, node: 'winter' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Looking for passage? Not north. Not across. Not toward the mountains, not this year. Bárðr. I ferry, when there is somewhere sane to ferry to.',
        sv: 'Söker du överfart? Inte norrut. Inte över. Inte mot bergen, inte i år. Bárðr. Jag för över folk, när det finns någonstans vettigt att föra dem.',
      },
      do: [{ k: 'set', flag: 'n_bardr_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'The lake reaches up to the feet of the mountains, and something breathes cold down from them. I watched ice creep in from the far shore in midsummer.',
        sv: 'Sjön når ända upp till bergens fot, och något andas kallt ner från dem. Jag såg isen krypa in från andra stranden mitt i sommaren.',
      },
      next: 'meet3',
    },
    meet3: {
      text: {
        en: 'So I row nobody that way until the pass is open. Ask me again then.',
        sv: 'Så jag ror ingen åt det hållet förrän passet är öppet. Fråga mig igen då.',
      },
    },
    day: {
      text: {
        en: 'Nobody rows toward the mountains. Ask me again when the pass is open.',
        sv: 'Ingen ror mot bergen. Fråga mig igen när passet är öppet.',
      },
    },
    winter: {
      text: {
        en: 'See how the channel steams? The warm springs keep it open, the only water on the lake not frozen. My boat sits in it like an egg in a nest.',
        sv: 'Ser du hur rännan ångar? De varma källorna håller den öppen, det enda vattnet på sjön som inte fryser. Båten ligger i den som ett ägg i ett bo.',
      },
    },
    frozen: {
      text: {
        en: 'The lake froze in one night. I will not row on that, and I will not walk it yet.',
        sv: 'Sjön frös på en natt. Jag ror inte på den där, och jag går inte på den än.',
      },
    },
    ferry: {
      text: {
        en: `The pass is open, so I keep my word. ${String(FERRY_FARE)} silver and I row you to the far landing in the reeds. Put a hand on the boat when you are ready.`,
        sv: `Passet är öppet, så jag håller mitt ord. ${String(FERRY_FARE)} silver så ror jag dig till bryggan i vassen på andra sidan. Lägg handen på båten när du är redo.`,
      },
    },
  },
};

/** At Bárðr's boat (the `ferry_out` script): his fare, or why he will not row. */
export const BARDR_FERRY: DialogueDef = {
  entry: [
    { when: not(flag('st_pass_open')), node: 'shut' },
    { when: WINTER, node: 'ice' },
    { when: { k: 'silver', gte: FERRY_FARE }, node: 'offer' },
    { node: 'poor' },
  ],
  nodes: {
    shut: {
      text: {
        en: 'Hands off the boat. Nobody rows toward the mountains until the pass is open.',
        sv: 'Bort med händerna från båten. Ingen ror mot bergen förrän passet är öppet.',
      },
    },
    ice: {
      text: {
        en: 'Row on that? The boat would sit on the ice like a sledge. Walk, if you must go.',
        sv: 'Ro på den där? Båten skulle stå på isen som en släde. Gå, om du måste.',
      },
    },
    offer: {
      text: {
        en: `${String(FERRY_FARE)} silver to the far landing. Coming back is free: wave from the end of the jetty over there and I will come.`,
        sv: `${String(FERRY_FARE)} silver till bryggan på andra sidan. Tillbaka är gratis: vinka från bryggans ände där borta så kommer jag.`,
      },
      choices: [
        {
          text: {
            en: `Row me across (${String(FERRY_FARE)} silver).`,
            sv: `Ro mig över (${String(FERRY_FARE)} silver).`,
          },
          do: [
            { k: 'silver', n: -FERRY_FARE },
            { k: 'set', flag: 'ev_ferry', value: true },
          ],
          next: 'off',
        },
        { text: { en: 'Not now.', sv: 'Inte nu.' } },
      ],
    },
    off: {
      text: {
        en: 'Sit low, and keep your hands out of the water.',
        sv: 'Sitt lågt, och håll händerna ur vattnet.',
      },
    },
    poor: {
      text: {
        en: `${String(FERRY_FARE)} silver. I row for silver, not for thanks.`,
        sv: `${String(FERRY_FARE)} silver. Jag ror för silver, inte för tack.`,
      },
    },
  },
};
