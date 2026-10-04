import type { ScreenDef } from '@core/world/screen';

export const hauPass: ScreenDef = {
  id: 'hau_pass',
  region: 'haugar',
  purpose:
    "The runestone pass: a gorge north towards the mountains, shut by a great stone door. Three seals flank it, one for each runestone, and they burn as the stones are lit. Hallsteinn keeps the old watch here. Once the stones open the door, the Rime King's breath freezes the gorge beyond into a wall of ice.",
  things: [
    /** The great door of the pass: shut until the three stones open it (M5). */
    {
      k: 'gate',
      at: { x: 18, y: 4 },
      w: 4,
      h: 1,
      art: 'slab',
      closed: { k: 'not', c: { k: 'flag', id: 'st_pass_open' } },
    },
    /** The gorge's end: the Rime King's breath, frozen into a wall of ice once the door opens. Eldr melts it. */
    {
      k: 'gate',
      at: { x: 18, y: 1 },
      w: 4,
      h: 1,
      art: 'rime',
      closed: { k: 'not', c: { k: 'flag', id: 'st_rime_open' } },
      melts: 'st_rime_open',
    },
    /** Walking up to the door with all three stones lit opens the pass: the end of Act I. */
    {
      k: 'trigger',
      at: { x: 16, y: 5 },
      w: 8,
      h: 1,
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'st_stone3_lit' },
          { k: 'not', c: { k: 'flag', id: 'st_pass_open' } },
        ],
      },
      script: 'pass_open',
    },
    /** The three seals, one for each runestone: dark until their stone is lit. */
    { k: 'seal', at: { x: 15, y: 4 }, lit: { k: 'flag', id: 'st_stone1_lit' } },
    { k: 'seal', at: { x: 19, y: 3 }, lit: { k: 'flag', id: 'st_stone2_lit' } },
    { k: 'seal', at: { x: 24, y: 4 }, lit: { k: 'flag', id: 'st_stone3_lit' } },
  ],
  /** Where Haugar's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 9, y: 10 },
    { x: 30, y: 12 },
    { x: 27, y: 18 },
  ],
  map: [
    '##################jjjj##################',
    '##################jjjj##################',
    '##################jjjj##################',
    '##################jjjj##################',
    '##################jjjj##################',
    '###############EjjjjjjjjE###############',
    '############EEEEjjjjjjjjEEEE############',
    '##########EEEEEEjjjjjjjjEEEEEE##########',
    '########EEEEEEEEjjjjjjjjEEEEEEEE########',
    '#######EEEEEEEEEEE,,,,EEEEEEEEEEE#######',
    '#######EEEEEEEEEEE,,,,EEEEEEEEEKE#######',
    '######EEKEEEEEEEEE,,,,EEEEEEEEEEEE######',
    '######EEEEEEEEEEEE,,,,EEEEEEEEEEEE######',
    '######EEEEEEEEEEEE,,,,EEEEEEEEEEEE######',
    '#######EEEEEEEEEEE,,,,EEEEEEEEEEE#######',
    ',,,,,,,,,,,,,,,,,,,,,,EEEEEEEEEEE#######',
    ',,,,,,,,,,,,,,,,,,,,,,EEEEEEEEEE########',
    ',,,,,,,,,,,,,,,,,,,,,,EEEEEKEE##########',
    '###########KEEEEEE,,,,EEEEEE############',
    '###############EEE,,,,EEE###############',
    '##################,,,,##################',
    '##################,,,,##################',
  ],
};
