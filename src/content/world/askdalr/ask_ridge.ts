import type { ScreenDef } from '@core/world/screen';

export const askRidge: ScreenDef = {
  id: 'ask_ridge',
  region: 'askdalr',
  purpose:
    'The ridge above the village: one-way ledges, an old runestone and a heart piece walled in by liftable rocks.',
  things: [
    {
      k: 'sign',
      at: { x: 20, y: 5 },
      text: {
        en: 'A runestone, cold and dark. The runes speak of a pass in the mountains.',
        sv: 'En runsten, kall och mörk. Runorna talar om ett pass i bergen.',
      },
    },
    { k: 'piece', id: 'hp_ask_ridge', at: { x: 33, y: 5 } },
    { k: 'prop', id: 'rock', at: { x: 32, y: 5 } },
    { k: 'prop', id: 'rock', at: { x: 34, y: 5 } },
    { k: 'prop', id: 'rock', at: { x: 33, y: 4 } },
    { k: 'prop', id: 'rock', at: { x: 33, y: 6 } },
  ],
  map: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'T######################################T',
    'T######################################T',
    'T######################################T',
    'TTT.........................""""""...TTT',
    'TTT.................M.......""""""...TTT',
    'TTT.........................""""""...TTT',
    'TTT..................................TTT',
    'TTT_______,,,________________________TTT',
    'TTT..................................TTT',
    'TTT..................................TTT',
    'TTT..................................TTT',
    'TTT..................................TTT',
    'TTT_______________,,,,_______________TTT',
    'TTT...............,,,,...............TTT',
    'TTT...............,,,,...........T...TTT',
    'TTT...T...........,,,,...............TTT',
    'TTT...............,,,,......T........TTT',
    'TTT.........T.....,,,,...............TTT',
    'TTT...............,,,,...............TTT',
    'TTT...............,,,,...............TTT',
    'TTTTTTTTTTTTTTTTTT,,,,TTTTTTTTTTTTTTTTTT',
  ],
};
