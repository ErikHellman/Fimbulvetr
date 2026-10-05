import type { ScreenDef } from '@core/world/screen';

export const hrfTowerfoot: ScreenDef = {
  id: 'hrf_towerfoot',
  region: 'hrimfjoll',
  purpose:
    'The foot of Hrímturn, the Rime Tower that the giantess Hrímgerðr grew out of the glacier. Its door is sealed with rime until the other three thanes have fallen; then it opens into Dungeon 7 (M9b).',
  cold: true,
  things: [
    /** Hrímturn's door, sealed with rime until three thanes have fallen. */
    {
      k: 'gate',
      at: { x: 19, y: 7 },
      w: 2,
      h: 1,
      art: 'rime',
      closed: { k: 'flag', id: 'q_thanes', lt: 3 },
    },
    {
      k: 'use',
      at: { x: 19, y: 7 },
      w: 2,
      h: 1,
      script: 'hrf_sealed',
      when: { k: 'flag', id: 'q_thanes', lt: 3 },
    },
    {
      k: 'sign',
      at: { x: 16, y: 9 },
      w: 1,
      h: 1,
      text: {
        en: 'Hrímturn. Four oaths hold the King asleep; while three still hold, this door holds too.',
        sv: 'Hrímturn. Fyra eder håller Kungen sovande; så länge tre håller, håller också denna dörr.',
      },
    },
  ],
  /** Where Hrímfjöll's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 9, y: 10 },
    { x: 30, y: 10 },
  ],
  map: [
    '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴▪▪▪▪▪▪▪▪▪▪▪▪▪▪∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴▪▪▪▪▪▪▪▪▪▪▪▪▪▪∴∴∴∴▒▒▒▒▒▒∴∴▒',
    '▒∴∴▒▒▒▒▒∴∴∴∴∴▪▪▪▪▪▪▪▪▪▪▪▪▪▪∴∴∴∴▒▒▒▒▒▒∴∴▒',
    '▒∴∴▒▒▒▒▒∴∴∴∴∴▪▪▪▪▪▪▪▪▪▪▪▪▪▪∴∴∴∴▒▒▒▒▒▒∴∴▒',
    '▒∴∴▒▒▒▒▒∴∴∴∴∴▪▪▪▪▪▪▪▪▪▪▪▪▪▪∴∴∴∴▒▒▒▒▒▒∴∴▒',
    '▒∴∴▒▒▒▒▒∴∴∴∴∴▪▪▪▪▪▪▫▫▪▪▪▪▪▪∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴▪▪▪▪▪▪▫▫▪▪▪▪▪▪∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴M∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴',
    '∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴',
    '∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴K∴∴∴∴∴∴∴∴∴∴∴∴',
    '∴∴∴∴∴∴∴∴∴∴∴K∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒∴∴∴▒',
    '▒∴∴∴▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴K∴∴∴∴∴∴∴▒▒▒▒▒▒∴∴∴▒',
    '▒∴∴∴▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒∴∴∴▒',
    '▒∴∴∴▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒∴∴∴∴▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒',
  ],
};
