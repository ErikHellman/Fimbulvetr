import type { ScreenDef } from '@core/world/screen';

export const saeReedbank: ScreenDef = {
  id: 'sae_reedbank',
  region: 'saevatn',
  purpose:
    "The east reed-bank, a strip of sand and grass under Myrkviðr's cliffs, reached only over the water or the ice.",
  things: [
    /** A nykr foal circles here, out of the ice's way (it is under it in winter). */
    {
      k: 'enemy',
      id: 'nykr_foal',
      at: { x: 17, y: 10 },
      when: { k: 'not', c: { k: 'season', is: 'winter' } },
    },
  ],
  /** Where Sævatn's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 27, y: 9 },
    { x: 29, y: 14 },
  ],
  map: [
    '~#######################################',
    '~#######################################',
    '~~~~~~~~~~~~~~~~~~~~~~~ynnnnnnnn########',
    '~~~~~~~~~~~~~~~~~~~~~~~ynnnn....########',
    '~~~~~~~~~~~~~~~~~~~~~~yynnnn..B.########',
    '~~~~~~~~~~~~~~~~~~~~~~~ynnnn...K########',
    '~~~~~~~~##~~~~~~~~~~~~~~nnnn....########',
    '~~~~~~~~~~~~~~~~~~~~~~~~nnnn....########',
    '~~~~~~~~~~~~~~~~~~~~~~~ynnnn.B..########',
    '~~~~~~~~~~~~~~~~~~~~~~~ynnnn....########',
    '~~~~~~~~~~~~~~~~~~~~~~yynnnn....########',
    '~~~~~~~~~~~~~~~~~~~~~~yynnnn....########',
    '~~~~~~~~~~~~~~~~~~~~~~~ynnnn...K########',
    '~~~~~~~~~~~~~~~~~~~~~~~~nnnn....########',
    '~~~~~~~~~~~~~~#~~~~~~~~~nnnn....########',
    '~~~~~~~~~~~~~~~~~~~~~~~ynnnn..K.########',
    '~~~~~~~~~~~~~~~~~~~~~~yynnnn....########',
    '~~~~~~~~~~~~~~~~~~~~~~yynnnn....########',
    '~~~~~~~~~~~~~~~~~~~~~~~ynnnnnnnn########',
    '~~~~~~~~~~~~~~~~~~~~~~~ynnnnnnnn########',
    '~#######################################',
    '########################################',
  ],
};
