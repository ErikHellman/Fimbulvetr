import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R35: ScreenDef = {
  id: 'd8_r35',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: "A guardroom below the west door hall: two draugr, and a small key's chest once they fall.",
  things: [
    { k: 'enemy', id: 'draugr', at: { x: 12, y: 10 } },
    { k: 'enemy', id: 'draugr', at: { x: 28, y: 10 } },
    { k: 'chest', id: 'd8_c_key1', at: { x: 20, y: 14 }, gives: { item: 'small_key' }, appear: 'clear' },
    { k: 'prop', id: 'pot', at: { x: 4, y: 18 } },
    { k: 'prop', id: 'pot', at: { x: 35, y: 18 } },
  ],
  map: room('n').pillars({ x: 6, y: 6 }, { x: 32, y: 6 }).done(),
};
