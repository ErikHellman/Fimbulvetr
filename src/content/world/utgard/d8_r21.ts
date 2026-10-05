import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R21: ScreenDef = {
  id: 'd8_r21',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    "The master key's vault: Jötunvörðr the warden, frozen hard until Eldr thaws him. Beaten, the master key's chest appears; it opens the great lock north to the keep.",
  things: [
    { k: 'shutter', at: { x: 0, y: 10 }, w: 1, h: 2, opens: 'clear' },
    {
      k: 'enemy',
      id: 'jotunvordr',
      at: { x: 20, y: 8 },
      onDeath: [{ k: 'set', flag: 'st_d8_warden', value: true }],
    },
    {
      k: 'chest',
      id: 'd8_c_bigkey',
      at: { x: 20, y: 14 },
      gives: { item: 'big_key' },
      appear: 'clear',
      text: {
        en: 'You found the master key of Útgarðr, as long as your arm. It opens the keep.',
        sv: 'Du hittade Útgarðrs huvudnyckel, lång som din arm. Den öppnar borgen.',
      },
    },
    { k: 'lock', id: 'd8_lock_big', at: { x: 19, y: 0 }, w: 2, h: 1, big: true },
  ],
  map: room('nw').pillars({ x: 6, y: 4 }, { x: 32, y: 4 }, { x: 6, y: 16 }, { x: 32, y: 16 }).done(),
};
