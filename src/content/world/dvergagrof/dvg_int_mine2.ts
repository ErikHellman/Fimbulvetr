import type { ScreenDef } from '@core/world/screen';

export const dvgIntMine2: ScreenDef = {
  id: 'dvg_int_mine2',
  region: 'dvergagrof',
  purpose:
    "The old workings, lower gallery: a dead miner and ember sprites between the shaft and the lamp-room, where Dvalinn's crew sheltered by their lamps. Hekla's escort ends at the lamp-room's mouth.",
  indoor: true,
  things: [
    { k: 'door', at: { x: 34, y: 20 }, dir: 's', to: 'dvg_int_mine1', arrive: { x: 6, y: 2 }, facing: 's' },
    /** Hekla brought to the lamp-room: the crew comes out (`q_foreman` 4). */
    {
      k: 'trigger',
      at: { x: 14, y: 5 },
      w: 4,
      h: 3,
      script: 'escort_done',
      when: {
        k: 'all',
        of: [
          { k: 'escort', npc: 'hekla' },
          { k: 'flag', id: 'q_foreman', eq: 3 },
        ],
      },
    },
    { k: 'enemy', id: 'draugr', at: { x: 28, y: 6 } },
    { k: 'enemy', id: 'glod', at: { x: 12, y: 12 } },
    { k: 'enemy', id: 'glod', at: { x: 30, y: 10 } },
  ],
  map: [
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QccccccccccccccccQcccccccccccccccccccccQ',
    'QccccccccccccccccQcccccccccccccccccccccQ',
    'QcchhcccccccchhccQccccccccccccccKccccccQ',
    'QcchhcccccccchhccQcccccccccccccccccccccQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QcccccccccccccccccccccccKccccccccccccccQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QccccccccccccccccQcccccccccccccccccccccQ',
    'QccccccccccccccccQcccccccccccccccccccccQ',
    'QQQQQQQQQQQQQQQQQQcccccccccccccccccccccQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QcccccccccccccccccccccQQQQQQQQQQQQQQQQQQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QcccccKccccccccccccccccccccccccccccccccQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QcccccccccccccccccccccccccccKccccccccccQ',
    'QccccccccccccccccccccccccccccccccccccccQ',
    'QcccccccccccccccccccccccccccccccccVccccQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
  ],
};
