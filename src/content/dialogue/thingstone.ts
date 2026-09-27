import type { DialogueDef } from '@core/story/dialogue';
import { flag } from './util';

/** The Þing-stone in Uppvík's square, where notices are pinned. */
export const THINGSTONE: DialogueDef = {
  entry: [{ when: flag('q_vargar_taken'), node: 'taken' }, { node: 'notices' }],
  nodes: {
    notices: {
      text: {
        en: 'Notices: “Lost: one grey goat.” “Wanted: whoever kills the leader of the vargr pack on the north road. Bersi pays.”',
        sv: 'Anslag: ”Borttappad: en grå get.” ”Sökes: den som fäller vargflockens ledare vid norra vägen. Bersi betalar.”',
      },
      choices: [
        { text: { en: 'Take the notice.', sv: 'Ta anslaget.' }, next: 'take' },
        { text: { en: 'Leave it.', sv: 'Låt det vara.' } },
      ],
    },
    take: {
      text: {
        en: 'You pull the hunters’ notice off its nail. The pack leader: black, white at the throat. It hunts the north road.',
        sv: 'Du drar ner jägaranslaget från spiken. Flockens ledare: svart, vit om strupen. Den jagar vid norra vägen.',
      },
      do: [{ k: 'set', flag: 'q_vargar_taken', value: true }],
    },
    taken: {
      text: {
        en: 'Notices: “Lost: one grey goat.” A nail where the hunters’ notice hung.',
        sv: 'Anslag: ”Borttappad: en grå get.” En spik där jägaranslaget satt.',
      },
    },
  },
};
