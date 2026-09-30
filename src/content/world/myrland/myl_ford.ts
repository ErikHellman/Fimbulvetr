import type { ScreenDef } from '@core/world/screen';

export const mylFord: ScreenDef = {
  id: 'myl_ford',
  region: 'myrland',
  purpose:
    'The shoal where the river can be waded, between rapids. In spring the meltwater runs over it and the way south is the old bridge downstream. A water-worm lies in the rapids beside the crossing.',
  things: [
    {
      k: 'sign',
      at: { x: 16, y: 10 },
      text: {
        en: 'The shoal. Wade across in summer. In spring, take the old bridge downstream.',
        sv: 'Grundet. Vada över på sommaren. På våren får du ta den gamla bron nedströms.',
      },
    },
    { k: 'enemy', id: 'vatnormr', at: { x: 23, y: 13 } },
  ],
  /** Where Mýrland's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 8, y: 4 },
    { x: 30, y: 4 },
    { x: 10, y: 18 },
    { x: 30, y: 18 },
  ],
  map: [
    'TTBBTTTTTTTBTTTTTT,,,,TBBBTTTTTTBBTBTTTB',
    'T...............".,,,,.......".........T',
    'T...."........."..,,,,...........".....T',
    'T"................,,,,.................T',
    'T..".......".."...,,,,................"T',
    'T.................,,,,"....".....".....B',
    'T.................,,,,....."...........T',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '................M..,,......y......yyyy..',
    '~~~~~~~~~~~~vvvvvveeeevvvvvvvvvvvvvvvvvv',
    '~~~~~~~~~~~~vvvvvveeeevvvvvvvvvvvvvvvvvv',
    '~~~~~~~~~~~~vvvvvveeeevvvvvvvvvvvvvvvvvv',
    '~~~~~~~~~~~~vvvvvveeeevvvvvvvvvvvvvvvvvv',
    '~~~~~~~~~~~~vvvvvveeeevvvvvvvvvvvvvvvvvv',
    '.y.....y..y.y.yy..,,,,..%%........%...TT',
    ',,,,,,,,,,,,,,,,,,,,,,..............%.TT',
    ',,,,,,,,,,,,,,,,,,,,,,...........%....TT',
    ',,,,,,,,,,,,,,,,,,,,,,.........%......TT',
    '..................,,,,................TT',
    'TTTTBTTBTBTTTTTTTT,,,,TBTTTBTTTBTBTBBTBT',
  ],
};
