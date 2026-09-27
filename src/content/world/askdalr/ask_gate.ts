import type { ScreenDef } from '@core/world/screen';
import { raidNight } from '../../dialogue/util';

export const askGate: ScreenDef = {
  id: 'ask_gate',
  region: 'askdalr',
  purpose: 'The palisade and the north gate to Myrkviðr. Barred during the prologue; Grímr keeps watch.',
  things: [
    { k: 'trigger', at: { x: 16, y: 11 }, w: 8, h: 2, script: 'raid_gate', when: raidNight },
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
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'T======================================T',
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
