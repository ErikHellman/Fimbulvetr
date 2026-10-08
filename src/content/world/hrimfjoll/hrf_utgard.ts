import type { ScreenDef } from '@core/world/screen';

export const hrfUtgard: ScreenDef = {
  id: 'hrf_utgard',
  region: 'hrimfjoll',
  purpose:
    "Útgarðr's gate in the ice: the giants' stronghold, shut with rime that no song melts. Halvar waits by it once the last thane falls, and his binding-words open it on Útgarðr (D8).",
  cold: true,
  things: [
    { k: 'door', at: { x: 19, y: 5 }, dir: 'n', to: 'd8_r36', arrive: { x: 19, y: 18 }, facing: 'n' },
    { k: 'door', at: { x: 20, y: 5 }, dir: 'n', to: 'd8_r36', arrive: { x: 20, y: 18 }, facing: 'n' },
    /** Útgarðr's gate: Halvar's binding-words melt it (M10a). */
    {
      k: 'gate',
      at: { x: 18, y: 6 },
      w: 4,
      h: 1,
      art: 'rime',
      closed: { k: 'not', c: { k: 'flag', id: 'st_utgard_open' } },
    },
    {
      k: 'sign',
      at: { x: 16, y: 8 },
      w: 1,
      h: 1,
      text: {
        en: 'Útgarðr. Beyond this gate the giants keep their King, and he is waking.',
        sv: 'Útgarðr. Bortom denna port håller jättarna sin Kung, och han håller på att vakna.',
      },
    },
  ],
  /** Where Hrímfjöll's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 12, y: 10 },
    { x: 27, y: 11 },
  ],
  map: [
    '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒',
    '▒∴∴∴∴∴∴∴▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴▒▒▒▒▒▒▒▒▒▒▫▫▫▫▒▒▒▒▒▒▒▒▒▒∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴▒▒▒▒▒▒▒▒▒▒▫▫▫▫▒▒▒▒▒▒▒▒▒▒∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴M∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒▒∴▒',
    '▒∴▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒▒∴▒',
    '▒∴▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒▒∴▒',
    '▒∴▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒▒∴▒',
    '▒∴▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒▒∴▒',
    '▒∴▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒▒∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒',
  ],
};
