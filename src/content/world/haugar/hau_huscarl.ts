import type { ScreenDef } from '@core/world/screen';

export const hauHuscarl: ScreenDef = {
  id: 'hau_huscarl',
  region: 'haugar',
  purpose:
    "Styrr's cottage and his practice yard, with a training post. The old huscarl teaches here, for silver.",
  things: [
    { k: 'door', at: { x: 24, y: 7 }, dir: 'n', to: 'hau_int_styrr', arrive: { x: 19, y: 14 }, facing: 'n' },
    /** Styrr's training post, moved aside while he duels. */
    { k: 'enemy', id: 'dummy', at: { x: 25, y: 16 }, when: { k: 'not', c: { k: 'flag', id: 'ev_duel_on' } } },
    /** The last duel: Styrr waits in his yard; at 0 he yields, and the win is Ask's. */
    {
      k: 'enemy',
      id: 'styrr_duel',
      at: { x: 25, y: 16 },
      when: { k: 'flag', id: 'ev_duel_on' },
      onDeath: [
        { k: 'set', flag: 'q_duel_won', value: true },
        { k: 'set', flag: 'ev_duel_on', value: false },
      ],
    },
    /** Styrr's last lesson, once the duel is won. */
    {
      k: 'trigger',
      at: { x: 0, y: 0 },
      w: 40,
      h: 22,
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'q_duel_won' },
          { k: 'not', c: { k: 'flag', id: 'st_bragd_learned' } },
        ],
      },
      script: 'duel_won',
    },
  ],
  map: [
    '########,,,,############################',
    '#EEEEEEE,,,,EEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '#EEEEEEE,,,,EEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '#EEEEEEE,,,,EEEEEEEERRRRRRRRRREEEEETEEE#',
    '#EEEEEEE,,,,EETEEEEERRCRRRRRRREEEEEEEEE#',
    '#EEEEEEE,,,,EEEEEEEERRRRRRRRRREEEEEEEEE#',
    '#EEEEEEE,,,,EEEEEEEERRRRRRRRRREEEEEEETE#',
    '#EEEEEEE,,,,EEEEEEEEWW+WDWW+WWEEEEEEEEE#',
    '#EEEEEEE,,,,EEEEEEEEEEEE,EEEEEEEEEEEEEE#',
    '#EEEEEEE,,,,EEEEEEEEEEEE,EEEEEEEEEEEEEE#',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,EEEEE#',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,EEEEE#',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,EEEEE#',
    '#EEEEEEEEEEEEEEEEEEEE====,====,,,,EEEEE#',
    '#EEEEEEEEEEEEEEEEEEEE=EEEEEEE=,,,,EEEEE#',
    '#EEEEEEEEEEEEEEEEEEEE=EEEEEEE=,,,,EEEEE#',
    '#EEEEEEEEEEEEEEEEEEEE=EEEEEEE=,,,,EETEE#',
    '#EETEEEEEEEEEEEEEEEEE=EEEEEEE=,,,,EEEEE#',
    '#EEEEEEEEEEEETEEEEEEE=========,,,,EEEEE#',
    '#EEEEEEEEEEEEEEEEEEEEEEEEEEEEE,,,,EEEEE#',
    '#EEEEEEEEEEEEEEEEEEEEEEEEEEEEE,,,,EEEEE#',
    '##############################,,,,######',
  ],
};
