import type { ScreenDef } from '@core/world/screen';

export const d1R03: ScreenDef = {
  id: 'd1_r03',
  region: 'myrkvidr',
  dungeon: 'd1',
  purpose:
    'Teaches sap: nothing walks through it. The first small key waits on an island, reached the long way round.',
  things: [
    { k: 'chest', id: 'd1_c_key1', at: { x: 19, y: 9 }, gives: { item: 'small_key' } },
    { k: 'enemy', id: 'root_biter', at: { x: 28, y: 19 } },
  ],
  map: [
    'QQQQQQQQQQQQQQQQQQQccQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQccQQQQQQQQQQQQQQQQQQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQcccczzzzzzzzzzzzzzzzzzzzzzzzzzzzccccQQ',
    'QQcccczzzzzzzzzzzzzzzzzzzzzzzzzzzzccccQQ',
    'QQcccczzzzzzzzzzzzzzzzzzzzzzzzzzzzccccQQ',
    'QQcccczzzzzzzzzzzzzzzzzzzzzzzzzzzzccccQQ',
    'QQcccczzzzzzzzzzcccccccczzzzzzzzzzccccQQ',
    'QQcccczzzzzzzzzzcccccccczzzzzzzzzzccccQQ',
    'cccccczzzzzzzzzzcccccccczzzzzzzzzzccccQQ',
    'cccccczzzzzzzzzzcccccccczzzzzzzzzzccccQQ',
    'QQcccczzzzzzzzzzcccccccczzzzzzzzzzccccQQ',
    'QQcccczzzzzzzzzzcccccccczzzzzzzzzzccccQQ',
    'QQcccczzzzzzzzzzzzzcczzzzzzzzzzzzzccccQQ',
    'QQcccczzzzzzzzzzzzzcczzzzzzzzzzzzzccccQQ',
    'QQcccczzzzzzzzzzzzzcczzzzzzzzzzzzzccccQQ',
    'QQcccczzzzzzzzzzzzzcczzzzzzzzzzzzzccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
  ],
};
