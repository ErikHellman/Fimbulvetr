import type { ScreenDef } from '@core/world/screen';

export const d1R04: ScreenDef = {
  id: 'd1_r04',
  region: 'myrkvidr',
  dungeon: 'd1',
  purpose:
    'The root puzzle: push both root blocks and the west shutter opens for good. Lock A to the north is a shortcut to the lair.',
  things: [
    { k: 'prop', id: 'root_block', at: { x: 12, y: 10 } },
    { k: 'prop', id: 'root_block', at: { x: 27, y: 11 } },
    { k: 'shutter', id: 'd1_sh_r04', at: { x: 0, y: 10 }, w: 1, h: 2, opens: 'blocks' },
    { k: 'lock', id: 'd1_lock_a', at: { x: 19, y: 0 }, w: 2, h: 1 },
  ],
  map: [
    'QQQQQQQQQQQQQQQQQQQccQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQccQQQQQQQQQQQQQQQQQQQ',
    'QQrrrrrrccccccccccccccccccccccccrrrrrrQQ',
    'QQrrrrrrccccccccccccccccccccccccrrrrrrQQ',
    'QQrrrrrrccccccccccccccccccccccccrrrrrrQQ',
    'QQrrrrrrccccccccccccccccccccccccrrrrrrQQ',
    'QQrrrrrrccccccccccccccccccccccccrrrrrrQQ',
    'QQrrrrrrccccccccQQQQQQQQccccccccrrrrrrQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'cccccccccccccccccccccccccccccccccccccccc',
    'cccccccccccccccccccccccccccccccccccccccc',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccQQQQQQQQccccccccccccccQQ',
    'QQrrrrrrccccccccccccccccccccccccrrrrrrQQ',
    'QQrrrrrrccccccccccccccccccccccccrrrrrrQQ',
    'QQrrrrrrccccccccccccccccccccccccrrrrrrQQ',
    'QQrrrrrrccccccccccccccccccccccccrrrrrrQQ',
    'QQrrrrrrccccccccccccccccccccccccrrrrrrQQ',
    'QQQQQQQQQQQQQQQQQQQccQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQccQQQQQQQQQQQQQQQQQQQ',
  ],
};
