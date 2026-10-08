import type { ScreenDef } from '@core/world/screen';

export const dvgIntMine1: ScreenDef = {
  id: 'dvg_int_mine1',
  region: 'dvergagrof',
  purpose:
    "The old workings behind the cave-in, upper gallery: a crooked switchback from the mine mouth to the shaft down to the lamp-room, walked by an ember sprite and a dead miner. Hekla's escort starts at its foot.",
  indoor: true,
  things: [
    { k: 'door', at: { x: 20, y: 20 }, dir: 's', to: 'dvg_minehead', arrive: { x: 20, y: 5 }, facing: 's' },
    { k: 'door', at: { x: 6, y: 1 }, dir: 'n', to: 'dvg_int_mine2', arrive: { x: 34, y: 19 }, facing: 'n' },
    /** Past the fall and on along the gallery for the first time: the way is open (`q_foreman` 2). */
    {
      k: 'trigger',
      at: { x: 14, y: 15 },
      w: 1,
      h: 6,
      script: 'dvg_mine_open',
      when: { k: 'flag', id: 'q_foreman', lt: 2 },
    },
    { k: 'enemy', id: 'glod', at: { x: 20, y: 11 } },
    { k: 'enemy', id: 'draugr', at: { x: 10, y: 4 } },
    { k: 'enemy', id: 'glod', at: { x: 30, y: 4 } },
  ],
  map: [
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQVQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QccccccccccccccKcccccccccccccccccccccccQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QccccccccccccccccccccccccKcccccccccccccQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQcccccccQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QcccccccccccKccccccccccccccccccccKcccccQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QcccccccQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QcccccccccccccccccccccccccccccccccccKccQ',
    'QccKcccccccccccccccccccccccccccccccccccQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QcccccccccccccccccccVccccccccccccccccccQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
  ],
};
