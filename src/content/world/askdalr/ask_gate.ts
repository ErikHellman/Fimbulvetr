import type { ScreenDef } from '@core/world/screen';
import { flag, not, raidNight } from '../../dialogue/util';

export const askGate: ScreenDef = {
  id: 'ask_gate',
  region: 'askdalr',
  purpose:
    'The palisade and the north gate to Myrkviðr, where Kolbeinn takes Embla on the raid night. Barred until Gyða has told the legend; Grímr keeps watch.',
  things: [
    { k: 'trigger', at: { x: 16, y: 11 }, w: 8, h: 2, script: 'raid_gate', when: raidNight },
    /** The palisade gate, barred until Gyða has told the legend. */
    { k: 'gate', at: { x: 18, y: 3 }, w: 4, h: 1, art: 'palisade', closed: not(flag('st_legend_told')) },
    {
      k: 'sign',
      at: { x: 17, y: 4 },
      text: {
        en: 'North gate. Beyond: Myrkviðr, the dark wood.',
        sv: 'Norra porten. Bortom: Myrkviðr, den mörka skogen.',
      },
    },
  ],
  map: [
    'TTTTTTTTTTTTTTTTTT,,,,TTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTT,,,,TTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTT,,,,TTTTTTTTTTTTTTTTTT',
    'T=================,,,,=================T',
    'T................M,,,,.................T',
    'T.................,,,,.................T',
    'T.................,,,,.................T',
    'T..T..............,,,,.................T',
    'T.................,,,,......"""""".....T',
    'T............T....,,,,......"""""".....T',
    'T.................,,,,......"""""".....T',
    'T.................,,,,......"""""".....T',
    'T...""""""........,,,,......"""""".T...T',
    'T...""""""........,,,,.................T',
    'T...""""""........,,,,.................T',
    'T...""""""........,,,,.................T',
    'T.................,,,,....T............T',
    'T.................,,,,.................T',
    'T......T..........,,,,..............T..T',
    'T.................,,,,.................T',
    'T.................,,,,.................T',
    'TTTTTTTTTTTTTTTTTT,,,,TTTTTTTTTTTTTTTTTT',
  ],
};
