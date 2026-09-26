import type { ScreenDef } from '@core/world/screen';

export const askGate: ScreenDef = {
  id: 'ask_gate',
  region: 'askdalr',
  purpose: 'The palisade and the north gate to Myrkviðr. Barred during the prologue; Grímr keeps watch.',
  things: [
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
