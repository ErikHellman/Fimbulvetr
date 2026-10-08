import type { ScreenDef } from '@core/world/screen';

export const dvgIntTunnel: ScreenDef = {
  id: 'dvg_int_tunnel',
  region: 'dvergagrof',
  purpose:
    "The cart road under the hills: rails from Dvergagröf's minehead to a hatch behind the forge in Ketill's smithy at Uppvík. Boarded halfway until Dvalinn's crew is out (`q_foreman` 5), then open both ways.",
  indoor: true,
  things: [
    { k: 'door', at: { x: 2, y: 8 }, dir: 'n', to: 'dvg_minehead', arrive: { x: 31, y: 5 }, facing: 's' },
    { k: 'door', at: { x: 37, y: 8 }, dir: 'n', to: 'upp_int_smithy', arrive: { x: 24, y: 7 }, facing: 's' },
    /** The boards across the road, until Dvalinn opens it. */
    {
      k: 'gate',
      at: { x: 20, y: 9 },
      w: 1,
      h: 4,
      art: 'logs',
      closed: { k: 'flag', id: 'q_foreman', lt: 5 },
    },
  ],
  map: [
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQVQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQVQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQppppppppppppppppppppppppppppppppppppQQ',
    'QQppppppppppppppppppppppppppppppppppppQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
  ],
};
