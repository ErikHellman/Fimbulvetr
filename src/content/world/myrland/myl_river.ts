import type { ScreenDef } from '@core/world/screen';

export const mylRiver: ScreenDef = {
  id: 'myl_river',
  region: 'myrland',
  purpose:
    'The wide slow river of Mýrland and the old plank bridge over it, the crossing in every season. The paths meet here: north to the ferry, south to the bog, west to the mill.',
  things: [{ k: 'enemy', id: 'vatnormr', at: { x: 30, y: 13 } }],
  /** Where Mýrland's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 5, y: 4 },
    { x: 30, y: 4 },
    { x: 28, y: 18 },
    { x: 12, y: 19 },
  ],
  map: [
    'BTTTTBBTBBTTTTTB..,,,..TTTTTBTTTBTTTTTTT',
    'T.......".........,,,................."T',
    'T..""...."..."....,,,......"...........T',
    'B.................,,,....."............B',
    'B"......".........,,,..................T',
    'T......."......"..,,,........".........T',
    'T.."......"...."..,,,..................T',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '........,,,..y......yy....y..yy.yy......',
    '~~~~~~~~JJJ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~JJJ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~JJJ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~JJJ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~JJJ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '..%.%...,,,...y....y.y..y...y.y...%..%..',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '.%..%....%........,,,................%..',
    'TTTTTTTTTTBTTTTTBT,,,TBBTTBTTBBTTBTBTTTT',
  ],
};
