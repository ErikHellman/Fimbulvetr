import type { Cond } from '@core/story/cond';
import type { ScreenDef, Thing } from '@core/world/screen';

/** Night, with the stolen grave-ring in Ask's bag. */
const RING_NIGHT: Cond = {
  k: 'all',
  of: [
    { k: 'phase', is: 'night' },
    { k: 'item', id: 'grave_ring' },
  ],
};

export const hauBarrows: ScreenDef = {
  id: 'hau_barrows',
  region: 'haugar',
  purpose:
    "The barrow field: grave mounds where the dead climb out at night, a great grave-hill whose cracked flank hides a piece of heart, and Geirmundr's tent by the road.",
  things: [
    /** The Norns' Haugar thread (`q_loom`): shown only at night, to one who knows Ljós. */
    {
      k: 'chest',
      id: 'hau_c_thread',
      at: { x: 4, y: 6 },
      gives: { item: 'norn_thread' },
      when: {
        k: 'all',
        of: [
          { k: 'phase', is: 'night' },
          { k: 'galdr', id: 'ljos' },
        ],
      },
    },
    /** Geirmundr's tent: his wares by day. */
    {
      k: 'use',
      at: { x: 11, y: 16 },
      w: 3,
      h: 2,
      script: 'shop_geirmundr',
      when: { k: 'not', c: { k: 'phase', is: 'night' } },
    },
    /** The cracked flank of the eastern grave-hill: a bomb opens the hollow and its piece of heart. */
    { k: 'crack', id: 'hau_k_barrows', at: { x: 31, y: 8 }, w: 1, h: 1, art: 'rock' },
    { k: 'piece', id: 'hp_hau_barrows', at: { x: 31, y: 4 } },
    /**
     * Geirmundr's stolen grave-ring goes back on the north-west mound, at night (`q_barrow_ring`). Its three
     * wights lie asleep round the mound while Ask carries the ring after dark, and rise as it is laid.
     */
    {
      k: 'use',
      at: { x: 3, y: 3 },
      script: 'ring_laid',
      when: { k: 'all', of: [RING_NIGHT, { k: 'not', c: { k: 'flag', id: 'q_ring_laid' } }] },
    },
    ...[
      [1, 5],
      [6, 4],
      [5, 6],
    ].map(([x = 0, y = 0]): Thing => ({
      k: 'enemy',
      id: 'haugbui',
      at: { x, y },
      when: RING_NIGHT,
      asleep: true,
    })),
    /** At night the barrow-wights climb out of their mounds. */
    { k: 'enemy', id: 'haugbui', at: { x: 13, y: 10 }, when: { k: 'phase', is: 'night' } },
    { k: 'enemy', id: 'haugbui', at: { x: 24, y: 9 }, when: { k: 'phase', is: 'night' } },
  ],
  /** Where Haugar's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 5, y: 5 },
    { x: 24, y: 4 },
    { x: 28, y: 18 },
    { x: 9, y: 19 },
  ],
  map: [
    '########,,,,############################',
    '#EEEEEEE,,,,EEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '#EEEEEEE,,,,EEEEEEEEEEEEEEEEEENNNEEEEEE#',
    '#EEmEEiE,,,,EEEmEEEEEEEEEEENNNNNNNNNEEE#',
    '#EEEEEEE,,,,EEEEEEEEEEmEEENNNNjjjNNNNEE#',
    '#EEEEEEE,,,,EEEEEEEEEEEEEENNNNjjjNNNNEE#',
    '#EEEEEEE,,,,,,,,,,EEEEEEEENNNNNjNNNNNEE#',
    '#EEEENNEEEEEEEEE,,EEEEEEEEENNNNjNNNNEEE#',
    '#EENNNNNNEEEEEEE,,EEEEEEEEEEEENjNEEEEEE#',
    '#ENNNNNNNNEEEEEE,,EEEEEEmEEEEEE,EEEEEEE#',
    '#EENNNNNNEEEEmEE,,EEEEEEEEEEEEE,EEEEiEE#',
    '#EEEENNEEEEEEEEE,,EEEEEEEEEEEEE,EEEEEEE#',
    '#EiEEEEEEEEmEEEE,,EEEEEEEEmEEEE,EEEEEEE#',
    '#EEEEEEmEEEEEEEE,,EEEEEEEEEEEEE,EEEEEEE#',
    '#EEEEEEEEEEEEEEE,,EEEEEEEEEEEE,,,,,,,,,,',
    '#EEEEEEEEEEEEEEE,,,,,,,,,,,,,,,,,,,,,,,,',
    '#EEEmEEEEEE&&&EE,,EEEEEEEEEEEE,,,,,,,,,,',
    '#EEEEEEEEEE&&&EE,,,,,,EEEEEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEE,,,,,,EEEiEEEEEEEEEEEEE#',
    '#EEEEiEEEEEEEEEE,,,,,,EEEEEEEEiEEEEEEEE#',
    '#EEEEEEEEEEEEEEE,,,,,,EEEEEEEEEEEEEEEEE#',
    '##################,,,,##################',
  ],
};
