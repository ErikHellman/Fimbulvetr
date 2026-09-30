import type { ScreenDef } from '@core/world/screen';

export const hauHuscarl: ScreenDef = {
  id: 'hau_huscarl',
  region: 'haugar',
  purpose:
    "Styrr's cottage and his practice yard, with a training post. The old huscarl teaches here, for silver.",
  things: [
    { k: 'door', at: { x: 24, y: 7 }, dir: 'n', to: 'hau_int_styrr', arrive: { x: 19, y: 14 }, facing: 'n' },
    /** Styrr's training post. */
    { k: 'enemy', id: 'dummy', at: { x: 25, y: 16 } },
  ],
  map: [
    '########,,,,############################',
    '#EEEEEEE,,,,EEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '#EEEEEEE,,,,EEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '#EEEEEEE,,,,EEEEEEEERRRRRRRRRREEEEETEEE#',
    '#EEEEEEE,,,,EETEEEEERRCRRRRRRREEEEEEEEE#',
    '#EEEEEEE,,,,EEEEEEEERRRRRRRRRREEEEEEEEE#',
    '#EEEEEEE,,,,EEEEEEEERRRRRRRRRREEEEEEETE#',
    '#EEEEEEE,,,,EEEEEEEEWW+WDWW+WWEEEEEEEEE#',
    '#EEEEEEE,,,,EEEEEEEEEEEE,EEEEEEEEEEEEEE#',
    '#EEEEEEE,,,,EEEEEEEEEEEE,EEEEEEEEEEEEEE#',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,EEEEE#',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,EEEEE#',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,EEEEE#',
    '#EEEEEEEEEEEEEEEEEEEE====,====,,,,EEEEE#',
    '#EEEEEEEEEEEEEEEEEEEE=EEEEEEE=,,,,EEEEE#',
    '#EEEEEEEEEEEEEEEEEEEE=EEEEEEE=,,,,EEEEE#',
    '#EEEEEEEEEEEEEEEEEEEE=EEEEEEE=,,,,EETEE#',
    '#EETEEEEEEEEEEEEEEEEE=EEEEEEE=,,,,EEEEE#',
    '#EEEEEEEEEEEETEEEEEEE=========,,,,EEEEE#',
    '#EEEEEEEEEEEEEEEEEEEEEEEEEEEEE,,,,EEEEE#',
    '#EEEEEEEEEEEEEEEEEEEEEEEEEEEEE,,,,EEEEE#',
    '##############################,,,,######',
  ],
};
