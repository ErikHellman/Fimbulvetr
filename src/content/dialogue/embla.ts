import type { DialogueDef } from '@core/story/dialogue';
import { all, day, eve, evening, eveningDue, flag, not, raid } from './util';

/**
 * Embla: small talk by day, and one evening scene on each of the three farm days. At the Refuge on Holmr
 * (M7a): the meeting on the shore, the comb for her sail-needle (trading step 5), and lines by time of day.
 */
export const EMBLA: DialogueDef = {
  entry: [
    { when: all(raid, not(flag('st_embla_found'))), node: 'found' },
    { when: all(flag('st_embla_found'), { k: 'item', id: 'trade_comb' }), node: 'comb' },
    { when: all(flag('st_embla_found'), evening), node: 'r_eve' },
    { when: flag('st_embla_found'), node: 'r_day' },
    { when: raid, node: 'raid' },
    { when: eveningDue(1), node: 'e1' },
    { when: eveningDue(2), node: 'e2' },
    { when: eveningDue(3), node: 'e3' },
    { when: evening, node: 'goodnight' },
    { when: day(1), node: 'd1' },
    { when: day(2), node: 'd2' },
    { when: day(3), node: 'd3' },
  ],
  nodes: {
    found: {
      text: {
        en: 'Ask! No, do not say it. I know what the cold took from Askdalr, and I know why. I heard it in the old songs long before the trolls came.',
        sv: 'Ask! Nej, säg det inte. Jag vet vad kylan tog från Askdalr, och jag vet varför. Jag hörde det i de gamla sångerna långt innan trollen kom.',
      },
      next: 'found2',
    },
    found2: {
      text: {
        en: 'The binding was sworn on our blood, the whole village’s. When they came I ran, because I knew what they wanted us for. I am sorry I could not take you with me.',
        sv: 'Bindningen svors på vårt blod, hela byns. När de kom sprang jag, för jag visste vad de ville ha oss till. Förlåt att jag inte kunde ta dig med mig.',
      },
      next: 'found3',
    },
    found3: {
      text: {
        en: 'But I have not been idle. Others got away too, and they are here. Four thanes keep the Rime King’s oath, and every one that falls loosens it. Come inside; I will show you the table.',
        sv: 'Men jag har inte suttit sysslolös. Fler kom undan, och de är här. Fyra hövdingar håller Rimkungens ed, och varje som faller lossar den. Kom in, så visar jag dig bordet.',
      },
      do: [{ k: 'set', flag: 'st_embla_found', value: true }],
    },
    comb: {
      text: {
        en: 'Is that a comb? Walrus ivory. Nobody has given me anything that was not for running in a long time. Here, take my sail-needle. For a dwarf who mends bellows and swears at them.',
        sv: 'Är det en kam? Valrossben. Ingen har gett mig något som inte var till för att fly på länge. Här, ta min segelnål. Till en dvärg som lagar blåsbälgar och svär åt dem.',
      },
      do: [
        { k: 'take', item: 'trade_comb' },
        { k: 'give', item: 'trade_needle' },
        { k: 'set', flag: 'q_trade', value: 5 },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
    },
    r_day: {
      text: {
        en: 'The table does not lie; it only waits. Look how many are still in the Rime King’s halls, and how many thanes still hold his oath.',
        sv: 'Bordet ljuger inte, det bara väntar. Se hur många som fortfarande sitter i Rimkungens salar, och hur många hövdingar som fortfarande håller hans ed.',
      },
    },
    r_eve: {
      text: {
        en: 'Sit by the fire a while. Out here even the smoke smells of home, if you close your eyes.',
        sv: 'Sitt vid elden en stund. Här ute luktar till och med röken hemma, om du blundar.',
      },
    },
    e1: {
      text: {
        en: 'There you are. Father had you chasing sheep all day?',
        sv: 'Där är du ju. Har far låtit dig jaga får hela dagen?',
      },
      next: 'e1q',
    },
    e1q: {
      text: { en: 'So who won?', sv: 'Så vem vann?' },
      choices: [
        { text: { en: 'The sheep.', sv: 'Fåren.' }, next: 'e1a' },
        { text: { en: 'I let them win.', sv: 'Jag lät dem vinna.' }, next: 'e1b' },
      ],
    },
    e1a: {
      text: {
        en: 'Honest, at least. Next time I will come and watch. Someone ought to laugh at you.',
        sv: 'Ärlig är du i alla fall. Nästa gång kommer jag och tittar. Någon borde skratta åt dig.',
      },
      next: 'e1end',
    },
    e1b: {
      text: {
        en: 'Generous of you. The sheep will write songs about it.',
        sv: 'Vad generöst. Fåren kommer att skriva visor om det.',
      },
      next: 'e1end',
    },
    e1end: {
      text: {
        en: 'Tomorrow I will tell you what I saw down by the brook. If you can stay awake that long…',
        sv: 'I morgon ska jag berätta vad jag såg nere vid bäcken. Om du kan hålla dig vaken så länge…',
      },
      do: [{ k: 'set', flag: eve(1), value: true }],
    },
    e2: {
      text: {
        en: 'You smell of pine and sweat. Very heroic.',
        sv: 'Du luktar tall och svett. Mycket hjältemodigt.',
      },
      next: 'e2b',
    },
    e2b: {
      text: {
        en: 'The brook? Oh. I saw ice on the reeds. In the middle of summer. Bjarni thinks it means the fish are angry.',
        sv: 'Bäcken? Jaha. Jag såg is på vassen. Mitt i sommaren. Bjarni tror att det betyder att fiskarna är arga.',
      },
      next: 'e2c',
    },
    e2c: {
      text: {
        en: 'When I sail south I will need someone who can split wood. Or… never mind.',
        sv: 'När jag seglar söderut behöver jag någon som kan klyva ved. Eller… strunt i det.',
      },
      do: [{ k: 'set', flag: eve(2), value: true }],
    },
    e3: {
      text: {
        en: 'The ravens were laughing at you all afternoon. I heard them from the square.',
        sv: 'Korparna skrattade åt dig hela eftermiddagen. Jag hörde dem från torget.',
      },
      next: 'e3b',
    },
    e3b: {
      text: {
        en: 'Ask… if I asked you to come with me, when I sail…',
        sv: 'Ask… om jag bad dig följa med mig, när jag seglar…',
      },
      next: 'e3c',
    },
    e3c: {
      text: {
        en: 'No. Ask me tomorrow. Goodnight, farmhand.',
        sv: 'Nej. Fråga mig i morgon. God natt, drängen.',
      },
      do: [{ k: 'set', flag: eve(3), value: true }],
    },
    goodnight: {
      text: { en: 'Goodnight, Ask. Do not snore.', sv: 'God natt, Ask. Snarka inte.' },
    },
    d1: {
      text: {
        en: 'Father is in a mood. The sheep again? They always run when he shouts.',
        sv: 'Far är på dåligt humör. Fåren igen? De springer alltid när han skriker.',
      },
    },
    d2: {
      text: {
        en: 'Hallbera says the mead has turned sour. Everything is sour this summer.',
        sv: 'Hallbera säger att mjödet har surnat. Allting är surt den här sommaren.',
      },
    },
    d3: {
      text: {
        en: 'Look at the sky in the north. It is the wrong colour.',
        sv: 'Titta på himlen i norr. Den har fel färg.',
      },
    },
    raid: {
      text: { en: 'Ask? What was that?', sv: 'Ask? Vad var det där?' },
      next: 'raid2',
    },
    raid2: {
      text: { en: 'Stay close to me.', sv: 'Håll dig nära mig.' },
    },
  },
};
