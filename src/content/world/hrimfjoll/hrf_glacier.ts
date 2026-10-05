import type { ScreenDef } from '@core/world/screen';

export const hrfGlacier: ScreenDef = {
  id: 'hrf_glacier',
  region: 'hrimfjoll',
  purpose:
    'The glacier: a sheet of glaze from cliff to cliff, strewn with boulders. A step onto it slides Ask on until a boulder or the far side stops the slide, so crossing is a matter of choosing where to stop. A heart piece waits on a patch of firn out on the ice.',
  cold: true,
  things: [{ k: 'piece', id: 'hp_hrf_glacier', at: { x: 17, y: 6 } }],
  /** Where Hrímfjöll's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 3, y: 5 },
    { x: 36, y: 16 },
  ],
  map: [
    '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒',
    '▒∴∴∴∴∴K◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇K◇◇◇◇◇◇◇◇◇∴∴∴∴∴▒',
    '▒∴∴∴∴∴◇◇◇◇◇◇◇◇K◇◇K◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇∴∴∴∴∴▒',
    '▒∴∴∴∴∴◇◇K◇◇◇◇K◇◇◇◇◇◇◇◇◇◇◇KKK◇◇◇◇◇◇∴∴∴∴∴▒',
    '▒∴∴∴∴∴◇◇◇◇◇K◇◇K◇◇◇◇◇◇◇◇K◇◇◇◇KK◇◇◇◇∴∴∴∴∴▒',
    '▒∴∴∴∴∴◇◇◇K◇◇◇◇◇◇◇◇◇◇◇◇K◇◇◇◇◇◇◇◇◇◇◇∴∴∴∴∴▒',
    '▒∴∴∴∴∴◇K◇◇◇◇◇◇◇◇K∴◇◇K◇◇K◇◇◇◇◇◇◇◇◇◇∴∴∴∴∴▒',
    '▒∴∴∴∴∴◇◇◇◇◇◇◇KK◇◇KK◇◇◇◇◇◇◇◇◇◇◇◇◇K◇∴∴∴∴∴▒',
    '▒∴∴∴∴∴◇◇◇◇◇K◇K◇K◇◇◇◇◇◇◇◇◇◇◇KK◇◇◇◇◇∴∴∴∴∴▒',
    '∴∴∴∴∴∴◇◇◇◇◇K◇◇◇◇◇◇◇◇◇◇◇◇◇◇K◇◇◇◇◇K◇∴∴∴∴∴∴',
    '∴∴∴∴∴∴◇K◇◇K◇◇K◇◇◇◇◇◇◇◇◇◇◇◇◇K◇◇◇◇◇◇∴∴∴∴∴∴',
    '∴∴∴∴∴∴◇◇K◇◇◇◇◇K◇◇◇◇◇K◇◇◇◇◇◇◇K◇◇◇◇◇∴∴∴∴∴∴',
    '∴∴∴∴∴∴◇◇◇◇◇◇◇◇◇◇◇◇K◇◇◇◇◇K◇◇◇KK◇◇◇◇∴∴∴∴∴∴',
    '▒∴∴∴∴∴◇◇K◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇K◇◇◇◇∴∴∴∴∴▒',
    '▒∴∴∴∴∴◇◇◇◇◇K◇◇◇◇◇◇◇◇◇K◇◇K◇◇◇◇◇◇K◇K∴∴∴∴∴▒',
    '▒∴∴∴∴∴◇K◇◇◇◇◇KK◇◇K◇◇◇◇◇◇◇◇K◇◇◇◇◇◇◇∴∴∴∴∴▒',
    '▒∴∴∴∴∴◇◇◇◇K◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇K◇◇◇◇◇◇∴∴∴∴∴▒',
    '▒∴∴∴∴∴◇◇◇◇◇◇◇◇◇◇◇◇◇◇K◇◇◇◇◇K◇◇◇◇K◇◇∴∴∴∴∴▒',
    '▒∴∴∴∴∴◇◇KK◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇∴∴∴∴∴▒',
    '▒∴∴∴∴∴◇◇◇◇◇◇◇K◇◇◇◇◇◇◇K◇◇◇◇◇◇K◇◇◇◇◇∴∴∴∴∴▒',
    '▒∴∴∴∴∴◇◇◇◇◇◇◇◇K◇◇◇K◇◇◇◇◇◇◇K◇◇◇◇◇◇◇∴∴∴∴∴▒',
    '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒',
  ],
};
