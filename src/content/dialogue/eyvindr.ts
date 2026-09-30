import type { DialogueDef } from '@core/story/dialogue';
import { evening, flag, not } from './util';

/** Eyvindr fishes off the jetty by day and tells stories in the mead hall by night. */
export const EYVINDR: DialogueDef = {
  entry: [
    { when: not(flag('n_eyvindr_met')), node: 'meet' },
    { when: evening, node: 'night' },
    { when: flag('n_kari_met'), node: 'kari' },
    { when: { k: 'weather', is: ['rain', 'storm'] }, node: 'rain' },
    { node: 'day' },
  ],
  nodes: {
    kari: {
      text: {
        en: 'You met old Kári down in Mýrland? He says his pike weighs as much as a calf. Liar. It weighs as much as two.',
        sv: 'Har du träffat gamle Kári nere i Mýrland? Han säger att hans gädda väger som en kalv. Lögnare. Den väger som två.',
      },
    },
    meet: {
      text: {
        en: 'Quiet, you will scare the fish. Eyvindr. Not that there are fish. The bay freezes earlier every winter.',
        sv: 'Tyst, du skrämmer fisken. Eyvindr. Inte för att det finns någon fisk. Viken fryser tidigare varje vinter.',
      },
      do: [{ k: 'set', flag: 'n_eyvindr_met', value: true }],
    },
    day: {
      text: {
        en: 'My grandfather fished this bay in his shirt all summer. I wear two cloaks in the harvest month.',
        sv: 'Min farfar fiskade i viken i bara skjortan hela sommaren. Jag bär två kappor i skördemånaden.',
      },
    },
    night: {
      text: {
        en: 'Out on the jetty at night I hear bells under the water. Glúmr says that is the mead. I drink less than Glúmr.',
        sv: 'Ute på bryggan om natten hör jag klockor under vattnet. Glúmr säger att det är mjödet. Jag dricker mindre än Glúmr.',
      },
    },
    rain: {
      text: {
        en: 'Fish do not mind the rain. I do. So here I sit, dry and fishless.',
        sv: 'Fisken bryr sig inte om regnet. Det gör jag. Så här sitter jag, torr och fisklös.',
      },
    },
  },
};
