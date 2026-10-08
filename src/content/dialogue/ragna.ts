import type { DialogueDef } from '@core/story/dialogue';
import { all, evening, flag, not } from './util';

/** Ragna, a ship's captain from the south, waits on the shore for a wind. She once met Embla. */
export const RAGNA: DialogueDef = {
  entry: [
    { when: not(flag('n_ragna_met')), node: 'meet' },
    { when: flag('q_amber_done'), node: 'amber_after' },
    { when: all(flag('q_amber_asked'), { k: 'item', id: 'amber', gte: 3 }), node: 'amber' },
    { when: flag('q_amber_asked'), node: 'amber_wait' },
    { when: flag('st_embla_found'), node: 'embla' },
    { when: flag('st_pass_open'), node: 'fimbul' },
    { when: evening, node: 'hall' },
    { when: { k: 'weather', is: ['rain', 'storm'] }, node: 'hall' },
    { when: flag('n_bardr_met'), node: 'ferry' },
    { node: 'day' },
  ],
  nodes: {
    embla: {
      text: {
        en: "Word came down with the ferryman: Halvar's girl lives, and leads the Refuge on Holmr. Tell her Uppvík's door is open to her, whatever the jarl says.",
        sv: 'Det kom bud med färjkarlen: Halvars flicka lever, och leder Tillflykten på Holmr. Säg att Uppvíks dörr står öppen för henne, vad jarlen än säger.',
      },
    },
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
      next: 'amber_ask',
    },
    amber_ask: {
      text: {
        en: 'When the Sea-Hart sails, I want something in her hold worth the trip. Amber sells like gold in the south. Mýrland hides it: in the cut reeds, under the peat, in the spring mud. Bring me three lumps?',
        sv: 'När Havshjorten seglar vill jag ha något i lastrummet som är resan värt. Bärnsten säljs som guld i söder. Mýrland gömmer den: i den skurna vassen, under torven, i vårleran. Ger du mig tre klumpar?',
      },
      do: [{ k: 'set', flag: 'q_amber_asked', value: true }],
    },
    amber_wait: {
      text: {
        en: 'Three lumps of Mýrland amber: the cut reeds, the peat, the spring mud. The ice will not hold the Sea-Hart forever.',
        sv: 'Tre klumpar bärnsten från Mýrland: den skurna vassen, torven, vårleran. Isen håller inte Havshjorten för evigt.',
      },
    },
    amber: {
      text: {
        en: 'Three! Hold one to the light: there is a fly in that one, older than any king. Take this arm-ring for them. Whoever wears it pays a quarter less, wherever they haggle.',
        sv: 'Tre! Håll en mot ljuset: det sitter en fluga i den där, äldre än någon kung. Ta den här armringen för dem. Den som bär den betalar en fjärdedel mindre, var de än köpslår.',
      },
      do: [
        { k: 'take', item: 'amber', n: 3 },
        { k: 'set', flag: 'w_ring_thrift', value: true },
        { k: 'set', flag: 'q_amber_done', value: true },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
      next: 'amber_ring',
    },
    amber_ring: {
      text: {
        en: '(The arm-ring of thrift: everything in the shops costs a quarter less. Wear it from the pause menu.)',
        sv: '(Armringen av sparsamhet: allt i bodarna kostar en fjärdedel mindre. Bär den från pausmenyn.)',
      },
    },
    amber_after: {
      text: {
        en: 'The amber is wrapped in wool in the hold. Now I need only a wind, and a bay without ice.',
        sv: 'Bärnstenen ligger inlindad i ull i lastrummet. Nu behöver jag bara en vind, och en vik utan is.',
      },
    },
  },
};
