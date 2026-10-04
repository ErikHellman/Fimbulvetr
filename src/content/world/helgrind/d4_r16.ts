import type { ScreenDef } from '@core/world/screen';

export const d4R16: ScreenDef = {
  id: 'd4_r16',
  region: 'niflmyrr',
  dungeon: 'd4',
  purpose:
    'The river hall: the Gjöll runs right across. A raft crosses to the north bank and its silver; a jetty to the west door is reached by post (6, 10) and left by post (5, 17). A cracked wall north hides a cache.',
  things: [
    { k: 'raft', at: { x: 16, y: 14 }, path: [{ x: 16, y: 6 }] },
    { k: 'post', at: { x: 6, y: 10 } },
    { k: 'post', at: { x: 5, y: 17 } },
    {
      k: 'chest',
      id: 'd4_c_r16',
      at: { x: 30, y: 3 },
      gives: {
        silver: 50,
        text: {
          en: 'Fifty silver, left on the bank by someone who never came back for it.',
          sv: 'Femtio silver, lämnade på stranden av någon som aldrig kom tillbaka efter dem.',
        },
      },
    },
    { k: 'crack', id: 'd4_k_r20', at: { x: 19, y: 0 }, w: 2, h: 1, art: 'wall' },
    { k: 'enemy', id: 'helhound', at: { x: 25, y: 3 } },
    { k: 'prop', id: 'pot', at: { x: 35, y: 18 } },
    { k: 'prop', id: 'pot', at: { x: 10, y: 18 } },
  ],
  map: [
    '8888888888888888888778888888888888888888',
    '8888888888888888888778888888888888888888',
    '8877777777777777777777777777777777777788',
    '8877777777777777777777777777777777777788',
    '8877777777777777777777777777777777777788',
    '8877777777777777777777777777777777777788',
    '88vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv88',
    '88vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv88',
    '88vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv88',
    '88vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv88',
    '7777777vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv88',
    '7777777vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv88',
    '88vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv88',
    '88vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv88',
    '88vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv88',
    '88vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv88',
    '8877777777777777777777777777777777777788',
    '8877777777777777777777777777777777777788',
    '8877777777777777777777777777777777777788',
    '8877777777777777777777777777777777777788',
    '8888888888888888888778888888888888888888',
    '8888888888888888888778888888888888888888',
  ],
};
