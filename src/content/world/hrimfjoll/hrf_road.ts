import type { ScreenDef } from '@core/world/screen';

export const hrfRoad: ScreenDef = {
  id: 'hrf_road',
  region: 'hrimfjoll',
  purpose:
    "The high road over the frost line, climbing out of Dvergagröf's ledges onto Hrímfjöll. The killing frost starts here: without the ember byrnie Ask can bear it for a few breaths, no more. The road goes on east, onto the glacier.",
  cold: true,
  things: [
    {
      k: 'sign',
      at: { x: 23, y: 18 },
      w: 1,
      h: 1,
      text: {
        en: 'Hrímfjöll. Turn back, unless the fire goes with you.',
        sv: 'Hrímfjöll. Vänd om, om inte elden går med dig.',
      },
    },
    /** Over the frost line in warm armour: Ask has reached Hrímfjöll. */
    {
      k: 'trigger',
      at: { x: 24, y: 15 },
      w: 5,
      h: 2,
      script: 'hrf_arrive',
      when: {
        k: 'all',
        of: [
          { k: 'not', c: { k: 'flag', id: 'st_hrf_reached' } },
          { k: 'armor', is: ['ember_byrnie', 'runeplate'] },
        ],
      },
    },
    /** Over the frost line without it: the cold says so. */
    {
      k: 'trigger',
      at: { x: 24, y: 15 },
      w: 5,
      h: 2,
      script: 'hrf_turned_back',
      when: { k: 'not', c: { k: 'armor', is: ['ember_byrnie', 'runeplate'] } },
    },
  ],
  /** Where Hrímfjöll's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 14, y: 6 },
    { x: 30, y: 11 },
    { x: 20, y: 4 },
  ],
  map: [
    '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴▒▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒▒▒∴∴▒',
    '▒∴▒▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒▒▒∴∴▒',
    '▒∴▒▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒▒▒∴∴▒',
    '▒∴▒▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴K∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴K∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴K∴∴∴∴∴',
    '▒∴∴∴∴∴K∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴K∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒∴∴▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴K∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒∴▒',
    '▒∴∴▒▒▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒∴▒',
    '▒∴∴▒▒▒▒▒▒∴∴∴▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒∴▒',
    '▒∴∴▒▒▒▒▒▒∴∴∴▒▒▒▒∴∴∴∴∴∴∴M∴∴∴∴∴∴∴∴▒▒▒▒▒▒∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒▒▒▒▒▒∴▒',
    '▒∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴∴▒',
    '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒∴∴∴▒▒▒▒▒▒▒▒▒▒▒▒',
  ],
};
