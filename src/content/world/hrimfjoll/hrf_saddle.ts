import type { ScreenDef } from '@core/world/screen';

export const hrfSaddle: ScreenDef = {
  id: 'hrf_saddle',
  region: 'hrimfjoll',
  purpose:
    'A wind-scoured saddle between two peaks, where the blizzards bite hardest. A seam of black ore rock shows in a rime cliff (a bomb breaks it). The way east climbs to Hrímturn.',
  cold: true,
  things: [
    /**
     * A tarn-eye in the saddle (M11a): frozen hard while the winter holds the mountain, it thaws once Hrímnir
     * is dead, and a diver finds the piece on its bottom.
     */
    { k: 'piece', id: 'hp_hrf_thaw', at: { x: 15, y: 17 }, sunk: true },

    /** Black ore rock in the cliff: a bomb breaks it, and ore lies behind. */
    { k: 'crack', id: 'hrf_k_ore', at: { x: 30, y: 5 }, w: 1, h: 1, art: 'rock' },
    { k: 'chest', id: 'hrf_c_ore', at: { x: 30, y: 4 }, gives: { item: 'ore', n: 3 } },
    { k: 'enemy', id: 'isvargr', at: { x: 20, y: 9 } },
    { k: 'enemy', id: 'isvargr', at: { x: 26, y: 8 } },
  ],
  /** Where Hrímfjöll's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 9, y: 10 },
    { x: 24, y: 16 },
    { x: 33, y: 11 },
  ],
  map: [
    '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒∴∴∴∴∴▒',
    '▒∴∴∴▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒∴∴∴∴∴▒',
    '▒∴∴∴▒▒▒▒▒▒∴∴∴∴∴▒▒▒∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒∴∴∴∴∴▒',
    '▒∴∴∴▒▒▒▒▒▒∴∴∴∴∴▒▒▒∴∴∴∴∴∴∴∴∴∴▒▒∴▒▒▒∴∴∴∴∴▒',
    '▒∴∴∴▒▒▒▒▒▒∴∴∴∴∴▒▒▒∴∴∴∴∴∴∴∴∴∴▒▒∴▒▒▒∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴K∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴K∴∴∴▒',
    '∴∴∴∴∴∴∴∴∴∴∴∴K∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴',
    '∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴',
    '∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴',
    '∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴K∴∴∴∴∴∴∴∴∴∴∴∴∴∴',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴▒▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒▒▒∴∴▒',
    '▒∴∴▒▒▒▒▒▒▒∴∴∴~~~~~∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒▒▒∴∴▒',
    '▒∴∴▒▒▒▒▒▒▒∴∴∴~~~~~∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒▒▒∴∴▒',
    '▒∴∴▒▒▒▒▒▒▒∴∴∴~~~~~∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒▒▒∴∴▒',
    '▒∴∴▒▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒▒▒∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒∴∴∴∴▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒',
  ],
};
