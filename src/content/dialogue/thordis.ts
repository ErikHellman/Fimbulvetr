import type { DialogueDef } from '@core/story/dialogue';
import { evening, flag, not } from './util';

/** Þórdís keeps Uppvík's mead hall, and gives every new traveller a horn. */
export const THORDIS: DialogueDef = {
  entry: [
    { when: not(flag('w_horn_thordis')), node: 'meet' },
    { when: flag('q_honey_done'), node: 'honey_after' },
    { when: { k: 'item', id: 'honey' }, node: 'honey' },
    { when: flag('q_honey_asked'), node: 'honey_wait' },
    { when: flag('st_pass_open'), node: 'fimbul' },
    { when: evening, node: 'night' },
    { when: { k: 'weather', is: ['rain', 'storm'] }, node: 'rain' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Mud to the knees and a blade on your back. You came up the forest road? Then sit. I am Þórdís. This is my hall.',
        sv: 'Lera till knäna och en klinga på ryggen. Kom du uppför skogsvägen? Sätt dig då. Jag är Þórdís. Det här är min hall.',
      },
      do: [{ k: 'set', flag: 'n_thordis_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'Nobody walks that road any more. Here, take a horn. A traveller without one is only half dressed.',
        sv: 'Ingen går den vägen längre. Här, ta ett horn. En vandrare utan horn är bara halvt påklädd.',
      },
      do: [
        { k: 'give', item: 'horn' },
        { k: 'set', flag: 'w_horn_thordis', value: true },
      ],
      next: 'meet3',
    },
    meet3: {
      text: {
        en: 'Hrafnkell sells mead to fill it. And the benches by the walls are yours whenever you need sleep.',
        sv: 'Hrafnkell säljer mjöd att fylla det med. Och bänkarna längs väggarna är dina när du behöver sova.',
      },
    },
    day: {
      text: {
        en: 'Quiet by day. The hall fills at dusk, when the smith puts down his hammer and Glúmr picks up his cup.',
        sv: 'Lugnt om dagen. Hallen fylls i skymningen, när smeden lägger ner hammaren och Glúmr tar upp bägaren.',
      },
      next: 'day2',
    },
    day2: {
      text: {
        en: 'They say a völva lives out in the fen, west of the north road. Folk go to her when the healers give up.',
        sv: 'Det sägs att en völva bor ute i kärret, väster om norra vägen. Folk går till henne när läkarna ger upp.',
      },
    },
    night: {
      text: {
        en: 'Keep your voice down, the benches are full. Sleep if you need to. Nobody here asks where you came from.',
        sv: 'Tala tyst, bänkarna är fulla. Sov om du behöver. Ingen här frågar var du kommer ifrån.',
      },
    },
    rain: {
      text: {
        en: 'Rain drives them all in here, and they drip on my floor. At least the mead sells.',
        sv: 'Regnet driver in dem allihop, och de droppar på mitt golv. Mjödet säljer i alla fall.',
      },
    },
    fimbul: {
      text: {
        en: 'Half the valley sleeps on my benches, and the other half wants to. I have never sold so much mead in a winter, nor wanted to less.',
        sv: 'Halva dalen sover på mina bänkar, och andra halvan vill göra det. Aldrig har jag sålt så mycket mjöd på en vinter, och aldrig har jag velat det mindre.',
      },
      next: 'honey_ask',
    },
    honey_ask: {
      text: {
        en: 'And my mead runs thin. There is a wild hive in the Myrkviðr pines, east of the forest road; smoke the bees with a lantern, in summer or autumn, and bring me the comb?',
        sv: 'Och mitt mjöd tryter. Det finns en vild bikupa bland tallarna i Myrkviðr, öster om skogsvägen; rök bina med en lykta, på sommaren eller hösten, och ge mig vaxkakan?',
      },
      do: [{ k: 'set', flag: 'q_honey_asked', value: true }],
    },
    honey_wait: {
      text: {
        en: 'The hive in the Myrkviðr pines. Summer or autumn, mind; in the cold the bees sleep on a frozen comb.',
        sv: 'Kupan bland tallarna i Myrkviðr. Sommar eller höst, märk väl; i kylan sover bina på en frusen kaka.',
      },
    },
    honey: {
      text: {
        en: 'Wild honey! That is a summer in a cask. Here, a horn of your own to carry what I brew with it.',
        sv: 'Vildhonung! Det är en sommar i en tunna. Här, ett eget horn att bära det jag brygger med den.',
      },
      do: [
        { k: 'take', item: 'honey' },
        { k: 'give', item: 'horn' },
        { k: 'set', flag: 'q_honey_done', value: true },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
    },
    honey_after: {
      text: {
        en: 'The honey-mead is working. Come back when it is ready, and bring a thirst.',
        sv: 'Honungsmjödet jäser. Kom tillbaka när det är klart, och ta med dig törsten.',
      },
    },
  },
};
