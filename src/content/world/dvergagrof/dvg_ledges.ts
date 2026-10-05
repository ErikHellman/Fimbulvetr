import type { ScreenDef } from '@core/world/screen';

export const dvgLedges: ScreenDef = {
  id: 'dvg_ledges',
  region: 'dvergagrof',
  purpose:
    'Cliff ledges under the frost line. The high road north to Hrímfjöll starts here (M9), and the killing frost on it turns back anyone not wrapped in an ember byrnie. Rime ravens nest on the ledges.',
  things: [
    {
      k: 'sign',
      at: { x: 18, y: 4 },
      w: 1,
      h: 1,
      text: {
        en: 'The high road. Past here the frost kills. The dwarves say only a smith’s ember-mail keeps it out.',
        sv: 'Den höga vägen. Bortom här dödar frosten. Dvärgarna säger att bara en smeds glödbrynja håller den ute.',
      },
    },
  ],
  /** Where Dvergagröf's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 9, y: 6 },
    { x: 32, y: 15 },
    { x: 18, y: 14 },
  ],
  map: [
    '#########################·,·############',
    '#########################·,·############',
    '#########################·,·############',
    '#########################·,·############',
    '#·················M······,·············#',
    '#························,·············#',
    '#·····K··················,··············',
    '#························,,,,,,,,,,,,,,,',
    '#························,··············',
    '#························,··············',
    '#···__________··_________,____·········#',
    '#························,·········K···#',
    '#························,·············#',
    '#························,·············#',
    '#························,·······K·····#',
    '#·········K··············,·············#',
    '#························,·············#',
    '#························,·············#',
    '#··················K·····,·············#',
    '#························,·············#',
    '#························,·············#',
    '########################·,··############',
  ],
};
