import type { ScreenDef } from '@core/world/screen';

export const d1R12: ScreenDef = {
  id: 'd1_r12',
  region: 'myrkvidr',
  dungeon: 'd1',
  purpose:
    "Rótvættr's lair. The shutter drops until it falls; then a heart container, and the first runestone to light.",
  things: [
    {
      k: 'shutter',
      at: { x: 19, y: 21 },
      w: 2,
      h: 1,
      opens: 'clear',
      when: { k: 'not', c: { k: 'flag', id: 'st_d1_boss_dead' } },
    },
    {
      k: 'enemy',
      id: 'rotvaettr',
      at: { x: 20, y: 5 },
      when: { k: 'not', c: { k: 'flag', id: 'st_d1_boss_dead' } },
      onDeath: [{ k: 'set', flag: 'st_d1_boss_dead', value: true }],
    },
    { k: 'heart', id: 'd1_hc', at: { x: 20, y: 9 }, when: { k: 'flag', id: 'st_d1_boss_dead' } },
    {
      k: 'use',
      at: { x: 20, y: 2 },
      script: 'stone1_light',
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'st_d1_boss_dead' },
          { k: 'not', c: { k: 'flag', id: 'st_stone1_lit' } },
        ],
      },
    },
  ],
  map: [
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQrrrrrrrrrrcccccrrrYrrcccccrrrrrrrrrrQQ',
    'QQrrrrrrrrrrccccccccccccccccrrrrrrrrrrQQ',
    'QQrrrrrrrrrrccccccccccccccccrrrrrrrrrrQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQrrrrrccccccccccccccccccccccccccrrrrrQQ',
    'QQrrrrrccccccccccccccccccccccccccrrrrrQQ',
    'QQrrrrrccccccccccccccccccccccccccrrrrrQQ',
    'QQQQQQQQQQQQQQQQQQQccQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQccQQQQQQQQQQQQQQQQQQQ',
  ],
};
