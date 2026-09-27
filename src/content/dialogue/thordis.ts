import type { DialogueDef } from '@core/story/dialogue';
import { evening, flag, not } from './util';

/** Þórdís keeps Uppvík's mead hall, and gives every new traveller a horn. */
export const THORDIS: DialogueDef = {
  entry: [
    { when: not(flag('w_horn_thordis')), node: 'meet' },
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
  },
};
