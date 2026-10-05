import type { ScreenDef } from '@core/world/screen';
import { all, flag, not } from '../../dialogue/util';
import { room } from './templates';

export const d8R12: ScreenDef = {
  id: 'd8_r12',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    "The binding hall, past Kolbeinn's (east): where Hrímnir the Rime King lies bound under the floor, waking. The last fight is here (M10b).",
  things: [
    {
      k: 'enemy',
      id: 'hrimnir',
      at: { x: 20, y: 4 },
      when: not(flag('st_hrimnir_dead')),
      onDeath: [{ k: 'set', flag: 'st_hrimnir_dead', value: true }],
    },
    /** Embla takes the binding in hand as Ask comes in; the ending runs as soon as the King is dead. */
    { k: 'trigger', at: { x: 30, y: 2 }, w: 8, h: 18, script: 'd8_embla', when: not(flag('st_d8_embla')) },
    {
      k: 'trigger',
      at: { x: 2, y: 2 },
      w: 36,
      h: 18,
      script: 'd8_ending',
      when: all(flag('st_hrimnir_dead'), not(flag('st_game_done'))),
    },
    {
      k: 'sign',
      at: { x: 20, y: 18 },
      text: {
        en: 'The floor is one great rune, cut so deep a man could lie in it. Under the ice in the middle, something breathes.',
        sv: 'Golvet är en enda stor runa, så djupt huggen att en man kunde ligga i den. Under isen i mitten andas något.',
      },
    },
  ],
  map: room('e').pillars({ x: 6, y: 4 }, { x: 32, y: 4 }, { x: 6, y: 16 }, { x: 32, y: 16 }).done(),
};
