import type { ScreenDef } from '@core/world/screen';

export const mylBog: ScreenDef = {
  id: 'myl_bog',
  region: 'myrland',
  purpose:
    'Open fen with black pools that freeze in winter; the causeway runs from the peat to the reed beds. Bog-lights at night.',
  things: [{ k: 'enemy', id: 'myrljos', at: { x: 20, y: 15 }, when: { k: 'phase', is: 'night' } }],
  /** Where Mýrland's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 6, y: 9 },
    { x: 30, y: 10 },
    { x: 10, y: 18 },
    { x: 27, y: 7 },
  ],
  map: [
    'TTBTBTTBTTBTTTTBBB,,,TTTTTTBBTTTBBBBTBTT',
    'Bggggggggggggggggg,,,ggggggggggggggggggT',
    'Tggggggggggggggggg,,,ggggggggggggggggggB',
    'Tggg~~~~~ggggggggg,,,ggg~~~~~~gggggggggT',
    'Bggg~~~~~ggggggggg,,,ggg~~~~~~gggggggggT',
    'Bggg~~~~~ggggggggg,,,ggy~~~~~~gggggggggT',
    'Tgggggggggggyggggg,,,gggggggyggggggggggB',
    'Bgggggggggggggygyg,,,ggggggggggggggygygB',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    'Tggggggggggg~~~~~~~ggggggggggggggggggggB',
    'Bgg"ygggggg"~~~~~~~ggg"yggggg~~~~~~ggggT',
    'Tggggggggggg~~~~~~~gggggggggy~~~~~~gyggT',
    'Tggg~~~~gggg~~~~~~~gggyyggygg~~~~~~ggygT',
    'Bggg~~~~ggggggggggggggggygggg~~~~~~ggggT',
    'Bggy~~~~gggggggggggyggggggg"gggggggg""gT',
    'Tggggygggggggggggg"gggggyyggggggggggg"gB',
    'TgggggyggggggggggggggggggggggggggggggggT',
    'BBTTBTTBTBTTTTBTTTTTTTBTTTBTTBTBTBTTTTBT',
    'TBTTTTTTBTBBTBTTTBBBTTTTBTBBTTBTTTTTBTTT',
  ],
};
