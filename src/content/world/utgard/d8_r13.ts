import type { ScreenDef } from '@core/world/screen';
import { any, flag, not } from '../../dialogue/util';
import { room } from './templates';

const decided = any(flag('st_kolbeinn_spared'), flag('st_kolbeinn_slain'));

export const d8R13: ScreenDef = {
  id: 'd8_r13',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    "Kolbeinn's hall in the keep, behind the great lock (south). He fights with his seiðr-staff; beaten, he kneels, and Ask spares or kills him. The door west to the binding hall opens as he falls.",
  things: [
    { k: 'lock', id: 'd8_lock_big', at: { x: 19, y: 21 }, w: 2, h: 1, big: true },
    {
      k: 'trigger',
      at: { x: 6, y: 4 },
      w: 28,
      h: 15,
      script: 'd8_kolbeinn',
      when: not(flag('st_d8_kolbeinn_met')),
    },
    {
      k: 'enemy',
      id: 'kolbeinn_boss',
      at: { x: 20, y: 6 },
      when: not(flag('st_kolbeinn_beaten')),
      onDeath: [{ k: 'set', flag: 'st_kolbeinn_beaten', value: true }],
    },
    {
      k: 'trigger',
      at: { x: 2, y: 2 },
      w: 36,
      h: 18,
      script: 'd8_kolbeinn_yield',
      when: { k: 'all', of: [flag('st_kolbeinn_beaten'), not(decided)] },
    },
    /** Open once he is beaten; the choice that follows fills the whole hall, so it always comes first. */
    { k: 'gate', at: { x: 0, y: 10 }, w: 2, h: 2, art: 'rime', closed: not(flag('st_kolbeinn_beaten')) },
  ],
  map: room('sw').pillars({ x: 8, y: 5 }, { x: 30, y: 5 }, { x: 8, y: 15 }, { x: 30, y: 15 }).done(),
};
