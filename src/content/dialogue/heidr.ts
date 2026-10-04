import type { DialogueDef } from '@core/story/dialogue';
import { all, flag, not } from './util';

/** Heiðr the völva sees in the smoke, brews mead for silver, and blue mead for fen-moss. */
export const HEIDR: DialogueDef = {
  entry: [
    { when: not(flag('n_heidr_met')), node: 'meet' },
    { when: flag('q_ljos_done'), node: 'lit' },
    { when: all(flag('q_ljos_asked'), { k: 'item', id: 'wisp_ember', gte: 3 }), node: 'embers' },
    { when: flag('q_ljos_asked'), node: 'ljos_wait' },
    { when: flag('st_rime_open'), node: 'ljos' },
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
    ljos: {
      text: {
        en: 'You went through the rime. I saw it: the smoke went grey as marsh-fog. The lights over Niflmýrr are the dead who could not cross.',
        sv: 'Du gick genom rimfrosten. Jag såg det: röken blev grå som kärrdimma. Ljusen över Niflmýrr är de döda som inte kunde ta sig över.',
      },
      next: 'ljos2',
    },
    ljos2: {
      text: {
        en: 'Bring me three of them in a jar, at night. Lift one gently, it will come. I will sing them into a light that fog cannot drink.',
        sv: 'Ge mig tre av dem i en kruka, om natten. Lyft en varsamt, så kommer den. Jag ska sjunga dem till ett ljus som dimman inte kan dricka.',
      },
      do: [{ k: 'set', flag: 'q_ljos_asked', value: true }],
    },
    ljos_wait: {
      text: {
        en: 'Three embers, from the marsh, at night. The dead are patient. I am less so.',
        sv: 'Tre glöder, från kärret, om natten. De döda är tålmodiga. Det är inte jag.',
      },
    },
    embers: {
      text: {
        en: 'Three. Hear them hum? They want to be somewhere. Hold still, and listen to the song I make of them.',
        sv: 'Tre. Hör du hur de surrar? De vill vara någonstans. Stå still, och lyssna på sången jag gör av dem.',
      },
      do: [
        { k: 'take', item: 'wisp_ember', n: 3 },
        { k: 'learn', galdr: 'ljos' },
        { k: 'set', flag: 'q_ljos_done', value: true },
        { k: 'sfx', id: 'sfx_ljos' },
      ],
      next: 'embers2',
    },
    embers2: {
      text: {
        en: 'Ljós. Sing it in the fog and the fog forgets itself. What hides in the dark will not hide from it. (Ready it in the pause menu.)',
        sv: 'Ljós. Sjung den i dimman så glömmer dimman sig själv. Det som gömmer sig i mörkret kan inte gömma sig för den. (Gör den redo i pausmenyn.)',
      },
    },
    lit: {
      text: {
        en: 'The embers went quiet in your song. I think they have crossed now. That is more than most of us get.',
        sv: 'Glöderna tystnade i din sång. Jag tror de har tagit sig över nu. Det är mer än de flesta av oss får.',
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
