import type { ScreenDef } from '@core/world/screen';

export const askHof: ScreenDef = {
  id: 'ask_hof',
  region: 'askdalr',
  purpose: "Gyða's hof and the old standing stones: where the legend is told after the raid.",
  things: [
    { k: 'door', at: { x: 20, y: 7 }, dir: 'n', to: 'ask_int_hof', arrive: { x: 20, y: 17 }, facing: 'n' },
    {
      k: 'sign',
      at: { x: 30, y: 11 },
      text: {
        en: 'The old stones of Askdalr. The runes are worn nearly smooth.',
        sv: 'Askdalrs gamla stenar. Runorna är nästan bortnötta.',
      },
    },
  ],
  map: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'T............RRRRRRRRRRRRRR............T',
    'T.......T....RRRRRRRRRRRRRR............T',
    'T...T........RRRRCRRRRRRRRR..........T.T',
    'T............RRRRRRRRRRRRRR............T',
    'T............RRRRRRRRRRRRRR............T',
    'T............RRRRRRRRRRRRRR...M........T',
    'T............WWWWWWWDWWWWWW............T',
    'T..................,,,............M....T',
    ',,,,,,,,,,,,,,,,,,,,,,.................T',
    ',,,,,,,,,,,,,,,,,,,,,,.................T',
    ',,,,,,,,,,,,,,,,,,,,,,........M........T',
    ',,,,,,,,,,,,,,,,,,,,,,..M..........M...T',
    'T......................................T',
    'T......................................T',
    'T..."""""".............................T',
    'T...""""""...............M.......M.....T',
    'T..."""""".............................T',
    'T...""""""...................M.........T',
    'T.........T..........................T.T',
    'T......................................T',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
};
