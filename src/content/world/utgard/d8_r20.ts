import type { ScreenDef } from '@core/world/screen';
import { all, flag, not } from '../../dialogue/util';
import { room } from './templates';

const sealed = all(flag('st_d8_seal_w'), flag('st_d8_seal_e'), flag('st_d8_seal_n'));

export const d8R20: ScreenDef = {
  id: 'd8_r20',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    "The seal hall: three seal-stones, one for each wing, burn as their seals are set. A rime door east to the master key's vault melts when all three burn. A basin (4, 2).",
  things: [
    { k: 'seal', at: { x: 12, y: 6 }, lit: flag('st_d8_seal_w') },
    { k: 'seal', at: { x: 20, y: 4 }, lit: flag('st_d8_seal_n') },
    { k: 'seal', at: { x: 28, y: 6 }, lit: flag('st_d8_seal_e') },
    { k: 'gate', at: { x: 38, y: 10 }, w: 2, h: 2, art: 'rime', closed: not(sealed) },
    { k: 'use', at: { x: 3, y: 2 }, w: 3, script: 'd8_basin' },
    {
      k: 'sign',
      at: { x: 20, y: 14 },
      text: {
        en: 'WEST, EAST AND HIGH. WHEN ALL THREE BURN, THE WARDEN WAKES AND THE KEY IS HIS TO GIVE.',
        sv: 'VÄSTER, ÖSTER OCH HÖGT. NÄR ALLA TRE BRINNER VAKNAR VÄKTAREN, OCH NYCKELN ÄR HANS ATT GE.',
      },
    },
  ],
  map: room('se').fill(3, 2, 3, 1, 'U').done(),
};
