import type { ScreenDef } from '@core/world/screen';

export const d1R09: ScreenDef = {
  id: 'd1_r09',
  region: 'myrkvidr',
  dungeon: 'd1',
  purpose:
    'Optional: root blocks choke the way in; a piece of heart lies on an island of sap for the boomerang to fetch.',
  things: [
    { k: 'prop', id: 'root_block', at: { x: 19, y: 15 } },
    { k: 'prop', id: 'root_block', at: { x: 20, y: 15 } },
    { k: 'piece', id: 'hp_d1_r09', at: { x: 30, y: 6 } },
  ],
  map: [
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQrrrrrrcccccccccccccczzzzzzzzzzzzzzzzQQ',
    'QQrrrrrrcccccccccccccczzzzzzzzzzzzzzzzQQ',
    'QQrrrrrrcccccccccccccczzzzzzzzzzzzzzzzQQ',
    'QQrrrrrrcccccccccccccczzzzzzzzzzzzzzzzQQ',
    'QQrrrrrrcccccccccccccczzzzzzzzczzzzzzzQQ',
    'QQrrrrrrcccccccccccccczzzzzzzzzzzzzzzzQQ',
    'QQcccccccccccccccccccczzzzzzzzzzzzzzzzQQ',
    'QQcccccccccccccccccccczzzzzzzzzzzzzzzzQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQrrrrrrrrrrrrrrrrrccrrrrrrrrrrrrrrrrrQQ',
    'QQrrrrrrrrrrrrrrrrrccrrrrrrrrrrrrrrrrrQQ',
    'QQrrrrrrrrrrrrrrrrrccrrrrrrrrrrrrrrrrrQQ',
    'QQrrrrrrrrrrrrrrrrrccrrrrrrrrrrrrrrrrrQQ',
    'QQrrrrrrrrrrrrrrrrrccrrrrrrrrrrrrrrrrrQQ',
    'QQrrrrrrrrrrrrrrrrrccrrrrrrrrrrrrrrrrrQQ',
    'QQQQQQQQQQQQQQQQQQQccQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQccQQQQQQQQQQQQQQQQQQQ',
  ],
};
