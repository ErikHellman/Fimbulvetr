import type { DialogueDef } from '@core/story/dialogue';
import { all, flag, not } from './util';

/** Heiðr the völva sees in the smoke, brews mead for silver, and blue mead for fen-moss. */
export const HEIDR: DialogueDef = {
  entry: [
    { when: not(flag('n_heidr_met')), node: 'meet' },
    { when: flag('st_pass_open'), node: 'fimbul' },
    { when: all(flag('st_myrland_reached'), not(flag('q_rs2_mill'))), node: 'serpent' },
    { when: flag('q_volva_done'), node: 'after' },
    { when: all(flag('q_volva_asked'), { k: 'item', id: 'fen_moss', gte: 3 }), node: 'moss' },
    { node: 'waiting' },
  ],
  nodes: {
    serpent: {
      text: {
        en: 'The smoke is muddy tonight. Something long lies coiled in the mud of Mýrland, where a wheel stopped turning.',
        sv: 'Röken är grumlig i kväll. Något långt ligger hoprullat i Mýrlands dy, där ett hjul slutade snurra.',
      },
    },
    meet: {
      text: {
        en: 'Come in, come in, you let the fog out. I am Heiðr. I saw you coming three nights ago, in the smoke.',
        sv: 'Kom in, kom in, du släpper ut dimman. Jag är Heiðr. Jag såg dig komma för tre nätter sedan, i röken.',
      },
      do: [{ k: 'set', flag: 'n_heidr_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'You carry the first stone’s light, and too few horns. Here. An empty horn is a promise to yourself.',
        sv: 'Du bär den första stenens ljus, och för få horn. Här. Ett tomt horn är ett löfte till dig själv.',
      },
      do: [{ k: 'give', item: 'horn' }],
      next: 'meet3',
    },
    meet3: {
      text: {
        en: 'I brew red mead and green, for silver. Bring me three clumps of fen-moss and I will brew you blue.',
        sv: 'Jag brygger rött mjöd och grönt, mot silver. Ge mig tre tuvor kärrmossa så brygger jag blått åt dig.',
      },
      next: 'meet4',
    },
    meet4: {
      text: {
        en: 'Fen-moss grows out in the bog in autumn, when the mists lie low. Only then.',
        sv: 'Kärrmossan växer ute i myren om hösten, när dimman ligger lågt. Bara då.',
      },
      do: [{ k: 'set', flag: 'q_volva_asked', value: true }],
    },
    waiting: {
      text: {
        en: 'Three clumps of fen-moss, from the bog in autumn. Then we shall see about blue.',
        sv: 'Tre tuvor kärrmossa, från myren om hösten. Sedan får vi se om det blå.',
      },
    },
    moss: {
      text: {
        en: 'Fen-moss, and fresh! Sit. Watch. Blue mead mends the body and the breath together.',
        sv: 'Kärrmossa, och färsk! Sitt. Titta. Blått mjöd lagar kroppen och andedräkten på en gång.',
      },
      do: [
        { k: 'take', item: 'fen_moss', n: 3 },
        { k: 'set', flag: 'q_volva_done', value: true },
      ],
      next: 'moss2',
    },
    moss2: {
      text: {
        en: 'I will keep some brewing for you. It costs more than red. Most good things do.',
        sv: 'Jag ska ha lite på jäsning åt dig. Det kostar mer än rött. Det gör det mesta som är gott.',
      },
    },
    after: {
      text: {
        en: 'The smoke shows me lights on an island in a frozen lake, and one burning brighter than the rest.',
        sv: 'Röken visar mig ljus på en ö i en frusen sjö, och ett som brinner starkare än de andra.',
      },
    },
    fimbul: {
      text: {
        en: 'The smoke shows me nothing now but white. Whatever woke in the mountain is looking back through it.',
        sv: 'Röken visar mig ingenting nu utom vitt. Det som vaknade i berget ser tillbaka genom den.',
      },
    },
  },
};
