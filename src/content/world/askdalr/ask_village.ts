import type { ScreenDef, Thing } from '@core/world/screen';
import { afterRaid } from '../../dialogue/util';

/** The captives' houses, boarded up since the raid. */
const SHUT: Thing[] = [
  [31, 5, 'st_freed_hallbera'],
  [8, 18, null],
  [31, 18, 'st_freed_rannveig'],
].map(([x = 0, y = 0, home]): Thing => ({
  k: 'scenery',
  at: { x: Number(x), y: Number(y) },
  w: 1,
  h: 1,
  art: 'boards',
  // Hallbera's boards come down once she is home from Sökkva Hof (M7b), Rannveig's from Ívaldi's Forge (M8b).
  shown:
    home === 'st_freed_hallbera' || home === 'st_freed_rannveig'
      ? { k: 'all', of: [afterRaid, { k: 'not', c: { k: 'flag', id: home } }] }
      : afterRaid,
}));

export const askVillage: ScreenDef = {
  id: 'ask_village',
  region: 'askdalr',
  purpose:
    "Askdalr village: the square, Sigrún's trading house (door) and the neighbours' houses. Most people are here by day.",
  things: [
    // Sigrún's crates (`q_crates`), set down in front of her door, each counted once.
    ...(['crate_a', 'crate_b', 'crate_c'] as const).map((id): Thing => ({
      k: 'drop',
      at: { x: 5, y: 6 },
      w: 7,
      h: 2,
      accepts: id,
      do: [
        {
          k: 'set',
          flag: id === 'crate_a' ? 'q_crate_a' : id === 'crate_b' ? 'q_crate_b' : 'q_crate_c',
          value: true,
        },
        { k: 'add', flag: 'q_crates_home', n: 1 },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
    })),
    /** The region's warp stone (Farvegr). */
    { k: 'warp', region: 'askdalr', at: { x: 24, y: 14 }, arrive: { x: 24, y: 15 } },
    { k: 'door', at: { x: 8, y: 5 }, dir: 'n', to: 'ask_int_trader', arrive: { x: 19, y: 17 }, facing: 'n' },
    {
      k: 'sign',
      at: { x: 14, y: 12 },
      w: 2,
      h: 2,
      text: {
        en: 'The village well. Someone has carved a sheep on it.',
        sv: 'Byns brunn. Någon har ristat ett får i den.',
      },
    },
    ...SHUT,
    /** Hallbera's door, by day once she is home from Sökkva Hof: red mead (M7b). */
    {
      k: 'use',
      at: { x: 30, y: 7 },
      w: 3,
      script: 'shop_hallbera',
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'st_freed_hallbera' },
          { k: 'not', c: { k: 'phase', is: 'night' } },
        ],
      },
    },
    /** Rannveig's door, by day once she is home from Ívaldi's Forge: arrows and bombs (M8b). */
    {
      k: 'use',
      at: { x: 30, y: 20 },
      w: 3,
      script: 'shop_rannveig',
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'st_freed_rannveig' },
          { k: 'not', c: { k: 'phase', is: 'night' } },
        ],
      },
    },
  ],
  map: [
    'TTTTTTTTTTTTTTTTTT,,,,TTTTTTTTTTTTTTTTTT',
    'T..RRRRRRRRRR.....,,,,....RRRRRRRRRR...T',
    'T..RRCRRRRRRR.....,,,,....RRRRRRRCRR...T',
    'T..RRRRRRRRRR..T..,,,,....RRRRRRRRRR...T',
    'T..RRRRRRRRRR.....,,,,..T.RRRRRRRRRR...T',
    'T..WWW+WDW+WW.....,,,,....WWW+WdW+WW.T.T',
    'T.................,,,,.................T',
    'T.................,,,,.................T',
    'T.;;;;;;;;;;;;;;;;,,,,;;;;;;;;;;;;;;;;.T',
    ',;;;;;;;;;;;;;;;;;,,,,;;;;;;;;;;;;;;;;;,',
    ',;;;;;;;;;;;;;;;;;,,,,;;;;;;;;;;;;;;;;;,',
    ',;;;;;;;;;;;;;;;;;,,,,;;;;;;;;;;;;;;;;;,',
    ',;;;;;;;;;;;;;OO;;,,,,;;;;;;;;;;;;;;;;;,',
    'T.;;;;;;;;;;;;OO;;,,,,;;;;;;;;;;;;;;;;.T',
    'T.................,,,,.................T',
    'T...RRRRRRRR......,,,,.....RRRRRRRRR...T',
    'T...RRCRRRRR......,,,,.....RRRRRRCRR...T',
    'T...RRRRRRRR....T.,,,,.....RRRRRRRRR...T',
    'T...WW+WdW+W......,,,,..T..WW+WdW+WW...T',
    'T.................,,,,.................T',
    'T.................,,,,.................T',
    'TTTTTTTTTTTTTTTTTT,,,,TTTTTTTTTTTTTTTTTT',
  ],
};
