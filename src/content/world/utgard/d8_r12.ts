import type { ScreenDef } from '@core/world/screen';
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
      onDeath: [{ k: 'set', flag: 'st_hrimnir_dead', value: true }],
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
