import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R04: ScreenDef = {
  id: 'd8_r04',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: "Past lock C (east): two draugr over the keep's roof, and a small key's chest once they fall.",
  things: [
    { k: 'lock', id: 'd8_lock_c', at: { x: 39, y: 10 }, w: 1, h: 2 },
    { k: 'enemy', id: 'draugr', at: { x: 12, y: 14 } },
    { k: 'enemy', id: 'draugr', at: { x: 28, y: 6 } },
    { k: 'chest', id: 'd8_c_key4', at: { x: 20, y: 6 }, gives: { item: 'small_key' }, appear: 'clear' },
    { k: 'prop', id: 'pot', at: { x: 35, y: 18 } },
  ],
  map: room('ew').pillars({ x: 8, y: 5 }, { x: 30, y: 14 }).done(),
};
