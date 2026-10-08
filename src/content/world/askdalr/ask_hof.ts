import type { ScreenDef } from '@core/world/screen';

export const askHof: ScreenDef = {
  id: 'ask_hof',
  region: 'askdalr',
  purpose: "Gyða's hof and the old standing stones: where the legend is told after the raid.",
  things: [
    /** One of Sigrún's crates, by the hof's stones (`q_crates`): lift it and carry it to her door in the village. */
    {
      k: 'prop',
      id: 'crate_b',
      at: { x: 34, y: 9 },
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'q_crates_asked' },
          { k: 'not', c: { k: 'flag', id: 'q_crate_b' } },
        ],
      },
    },
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
