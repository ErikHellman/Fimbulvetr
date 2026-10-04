import type { DialogueDef } from '@core/story/dialogue';
import { evening, flag, not } from './util';

/** Ragna, a ship's captain from the south, waits on the shore for a wind. She once met Embla. */
export const RAGNA: DialogueDef = {
  entry: [
    { when: not(flag('n_ragna_met')), node: 'meet' },
    { when: flag('st_pass_open'), node: 'fimbul' },
    { when: evening, node: 'hall' },
    { when: { k: 'weather', is: ['rain', 'storm'] }, node: 'hall' },
    { when: flag('n_bardr_met'), node: 'ferry' },
    { node: 'day' },
  ],
  nodes: {
    ferry: {
      text: {
        en: 'You met Bárðr at the lake? He would not row me north either. Nobody rows toward the mountains this year.',
        sv: 'Har du träffat Bárðr vid sjön? Han ville inte ro mig norrut heller. Ingen ror mot bergen i år.',
      },
    },
    meet: {
      text: {
        en: 'Ragna, captain of the Sea-Hart. She lies out in the bay, waiting for a wind worth sailing south on.',
        sv: 'Ragna, skeppare på Havshjorten. Hon ligger ute i viken och väntar på en vind värd att segla söderut på.',
      },
      do: [{ k: 'set', flag: 'n_ragna_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'From Askdalr? A girl from there once asked me the price of passage south. Red braid, sharp tongue.',
        sv: 'Från Askdalr? En flicka därifrån frågade en gång vad en överfart söderut kostar. Röd fläta, vass tunga.',
      },
      next: 'meet3',
    },
    meet3: {
      text: {
        en: 'She said she would come back with the silver. I told her the south is not warmer, only further. She laughed.',
        sv: 'Hon sa att hon skulle komma tillbaka med silvret. Jag sa att södern inte är varmare, bara längre bort. Hon skrattade.',
      },
    },
    day: {
      text: {
        en: 'In the south the winters end. Here I am not so sure any more. Every morning the bay is a little whiter.',
        sv: 'I söder tar vintrarna slut. Här är jag inte så säker längre. Varje morgon är viken lite vitare.',
      },
    },
    hall: {
      text: {
        en: 'Sailors drink to a fair wind. I drink to any wind at all. The air here has gone still and cold, lad.',
        sv: 'Sjöfolk dricker för god vind. Jag dricker för vilken vind som helst. Luften här har blivit stilla och kall, pojk.',
      },
    },
    fimbul: {
      text: {
        en: 'The bay froze in one breath, with three ships still in it. No sail leaves Uppvík before spring, if spring comes.',
        sv: 'Viken frös på ett andetag, med tre skepp kvar i sig. Inget segel lämnar Uppvík före våren, om våren kommer.',
      },
    },
  },
};
