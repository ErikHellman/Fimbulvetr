import type { DialogueDef } from '@core/story/dialogue';
import { flag } from './util';

/** Hreggviðr the ore-trader at the Refuge: he takes black ore, not silver. */
export const HREGGVIDR: DialogueDef = {
  entry: [{ when: flag('st_dvg_reached'), node: 'dvg' }, { node: 'ore' }],
  nodes: {
    dvg: {
      text: {
        en: 'You have been to Dvergagröf and come back with all your fingers? Then you have more luck than sense. Ore, still, and nothing else.',
        sv: 'Har du varit i Dvergagröf och kommit tillbaka med alla fingrar kvar? Då har du mer tur än förstånd. Malm, fortfarande, och inget annat.',
      },
    },
    ore: {
      text: {
        en: 'Silver? Out here silver buys nothing. Bring me black ore: it breaks out of the dark rocks on the north shallows, if you have something that breaks rock.',
        sv: 'Silver? Här ute köper silver ingenting. Ge mig svart malm: den bryts ur de mörka klipporna vid de norra grunden, om du har något som spränger sten.',
      },
    },
  },
};
