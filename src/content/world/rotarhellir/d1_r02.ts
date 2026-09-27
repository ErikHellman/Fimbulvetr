import type { ScreenDef } from '@core/world/screen';

export const d1R02: ScreenDef = {
  id: 'd1_r02',
  region: 'myrkvidr',
  dungeon: 'd1',
  purpose:
    'Teaches vines (the sword cuts them) and the root-biter (wait for it to rise, then strike). Silver behind them.',
  things: [
    { k: 'prop', id: 'vines', at: { x: 30, y: 10 } },
    { k: 'prop', id: 'vines', at: { x: 30, y: 11 } },
    { k: 'enemy', id: 'root_biter', at: { x: 22, y: 6 } },
    { k: 'enemy', id: 'root_biter', at: { x: 9, y: 14 } },
    {
      k: 'chest',
      id: 'd1_c_r02',
      at: { x: 5, y: 10 },
      gives: {
        silver: 20,
        text: { en: 'You found twenty pieces of silver.', sv: 'Du hittade tjugo silverbitar.' },
      },
    },
  ],
  map: [
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQrrrcccccccccccccccccccccccccQrrrrrrrQQ',
    'QQrrrcccccccccccccccccccccccccQrrrrrrrQQ',
    'QQrrrcccccccccccccccccccccccccQrrrrrrrQQ',
    'QQccccccccccccccccccccccccccccQrrrrrrrQQ',
    'QQccccccccccccccccccccccccccccQrrrrrrrQQ',
    'QQccccccccccccccccccccccccccccQrrrrrrrQQ',
    'QQccccccccccccccccccccccccccccQrrrrrrrQQ',
    'QQccccccccccccQQccccccccccccccQcccccccQQ',
    'QQccccccccccccQQcccccccccccccccccccccccc',
    'QQccccccccccccQQcccccccccccccccccccccccc',
    'QQccccccccccccQQccccccccccccccQcccccccQQ',
    'QQccccccccccccccccccccccccccccQrrrrrrrQQ',
    'QQccccccccccccccccccccccccccccQrrrrrrrQQ',
    'QQccccccccccccccccccccccccccccQrrrrrrrQQ',
    'QQccccccccccccccccccccccccccccQrrrrrrrQQ',
    'QQrrrrccccccccccccccccccccccccQrrrrrrrQQ',
    'QQrrrrccccccccccccccccccccccccQrrrrrrrQQ',
    'QQrrrrccccccccccccccccccccccccQrrrrrrrQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
  ],
};
