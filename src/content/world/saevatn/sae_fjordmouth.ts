import type { ScreenDef } from '@core/world/screen';

export const saeFjordmouth: ScreenDef = {
  id: 'sae_fjordmouth',
  region: 'saevatn',
  purpose:
    "Where Sævatn meets Niflmýrr's strand: the lake runs east into the fog, between a sand beach and a rocky point. The Gjöll's current runs on out into the lake and never freezes, so in winter the ice stops short of the strand.",
  things: [
    {
      k: 'sign',
      at: { x: 16, y: 2 },
      text: {
        en: 'A seal-hunter’s mark on a post: a seal, a wave, and a line pointing south over the water.',
        sv: 'En sältjägares märke på en stolpe: en säl, en våg och ett streck som pekar söderut över vattnet.',
      },
    },
  ],
  /** Where Sævatn's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 15, y: 4 },
    { x: 8, y: 14 },
  ],
  map: [
    '########################################',
    '########################################',
    '###########nnnKnnnnnnnn~~~~~~~<<<<~~~~~~',
    '###########nnnnnnnnKnnn~~~~~~~<<<<~~~~~~',
    '###########nnnnnnnnnnnn~~~~~~~<<<<~~~~~~',
    '###########nnnnnnnnnnny~~~~~~~<<<<~~~~~~',
    '###########nyynnnnnnnnn~~~~~~~<<<<~~~~~~',
    '###########~~~~~~~~~~~~~~~~~~~<<<<~~~~~~',
    '###########~~~~~~~~~~~~~~~~~~~<<<<~~~~~~',
    '###########~~~~~~~~~~~~~~~~~~~<<<<~~~~~~',
    '#######nnnn~~~~~~~~~~~~~~~~~~~<<<<~~~~~~',
    '#######nnnn~~~~~~~~~~~~~~~~~~~<<<<~~~~~~',
    '#######nKnn~~~~~~~~~~~~~~~~~~~<<<<~~~~~~',
    '#######nnnn~~~~~~~~~~~~~~~~~~~<<<<~~~~~~',
    '#######nnnn~~~~~~~~~~~~~~~~~~~<<<<~~~~~~',
    '#######nnnn~~~~~~~~~~~~~~~~~~~<<<<~~~~~~',
    '#######nnnn~~~~~~~~~~~~~~~~~~~<<<<~~~~~~',
    '#######nnny~~~~~~~~~~~~~~~~~~~<<<<~~~~~~',
    '#######~~~~~~~~~~~~~~~~~~~~~~~<<<<~~~~~~',
    '#######~~~~~~~~~~~~~~~~~~~~~~~<<<<~~~~~~',
    '#######~~~~~~~~~~~~~~~~~~~~~~~~~########',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~########',
  ],
};
