import type { DialogueDef } from '@core/story/dialogue';

/** Hreggviðr the ore-trader at the Refuge: he takes black ore, not silver. */
export const HREGGVIDR: DialogueDef = {
  entry: [{ node: 'ore' }],
  nodes: {
    ore: {
      text: {
        en: 'Silver? Out here silver buys nothing. Bring me black ore: it breaks out of the dark rocks on the north shallows, if you have something that breaks rock.',
        sv: 'Silver? Här ute köper silver ingenting. Ge mig svart malm: den bryts ur de mörka klipporna vid de norra grunden, om du har något som spränger sten.',
      },
    },
  },
};
