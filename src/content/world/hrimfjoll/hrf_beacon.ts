import type { ScreenDef } from '@core/world/screen';

export const hrfBeacon: ScreenDef = {
  id: 'hrf_beacon',
  region: 'hrimfjoll',
  purpose:
    "The beacon hill: the old watch-fire that warned the lowlands of the giants, dark since the first frost cracked its lens. Ormr the beacon-keeper still lives in the stone hut below it. Hrímfjöll's warp stone stands on the hill.",
  cold: true,
  things: [
    { k: 'door', at: { x: 9, y: 6 }, dir: 'n', to: 'hrf_int_hut', arrive: { x: 19, y: 15 }, facing: 'n' },
    /** The beacon, alight again once Ormr has Sindri's lens. */
    { k: 'fire', at: { x: 29, y: 4 }, w: 1, h: 1, when: { k: 'flag', id: 'st_beacon_lit' } },
    {
      k: 'sign',
      at: { x: 26, y: 7 },
      w: 1,
      h: 1,
      text: {
        en: 'The beacon of the high road. When it burns, the valleys know the giants are stirring.',
        sv: 'Höga vägens vårdkase. När den brinner vet dalarna att jättarna rör på sig.',
      },
    },
    { k: 'warp', region: 'hrimfjoll', at: { x: 20, y: 15 }, arrive: { x: 20, y: 16 } },
  ],
  /** Where Hrímfjöll's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 15, y: 10 },
    { x: 32, y: 12 },
  ],
  map: [
    '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒∴∴∴∴▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴RRRRRRRR∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴RRRRRCRR∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒j▒▒∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴RRRRRRRR∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴WWWWDWWW∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴M∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴K∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴',
    '∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴',
    '∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴',
    '∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴K∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴K∴∴∴∴∴▒',
    '▒∴∴∴∴∴K∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒',
  ],
};
