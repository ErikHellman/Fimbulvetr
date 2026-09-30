import type { ScreenDef } from '@core/world/screen';

export const hauKing: ScreenDef = {
  id: 'hau_king',
  region: 'haugar',
  purpose:
    "Konungshaugr, the King's Barrow: a great grave-hill with a stone door on its south face, shut until the barrow-watch is kept. At night, with Styrr's word, the dead come out of their mounds to guard it.",
  things: [
    /** Through the open door, down into Konungshaugr. */
    { k: 'door', at: { x: 19, y: 10 }, dir: 'n', to: 'd3_r01', arrive: { x: 19, y: 18 }, facing: 'n' },
    { k: 'door', at: { x: 20, y: 10 }, dir: 'n', to: 'd3_r01', arrive: { x: 20, y: 18 }, facing: 'n' },
    /** The barrow's door: shut until the watch is kept. */
    {
      k: 'gate',
      at: { x: 19, y: 10 },
      w: 2,
      h: 1,
      art: 'slab',
      closed: { k: 'not', c: { k: 'flag', id: 'st_barrow_open' } },
    },
    {
      k: 'sign',
      at: { x: 16, y: 11 },
      text: {
        en: 'Runes on the stone: HERE LIES THE KING UNDER THE HILL. KEEP WATCH, AND HE WILL KNOW YOU.',
        sv: 'Runor på stenen: HÄR LIGGER KUNGEN UNDER KULLEN. HÅLL VAKT, SÅ SKA HAN KÄNNA DIG.',
      },
    },
    /** The barrow-watch: three wights rise at night once Styrr has told Ask of it. */
    {
      k: 'enemy',
      id: 'haugbui',
      at: { x: 13, y: 13 },
      when: {
        k: 'all',
        of: [
          { k: 'phase', is: 'night' },
          { k: 'flag', id: 'q_rs3_watch' },
          { k: 'not', c: { k: 'flag', id: 'st_barrow_open' } },
        ],
      },
      onDeath: [{ k: 'add', flag: 'q_watch_kills', n: 1 }],
    },
    {
      k: 'enemy',
      id: 'haugbui',
      at: { x: 26, y: 13 },
      when: {
        k: 'all',
        of: [
          { k: 'phase', is: 'night' },
          { k: 'flag', id: 'q_rs3_watch' },
          { k: 'not', c: { k: 'flag', id: 'st_barrow_open' } },
        ],
      },
      onDeath: [{ k: 'add', flag: 'q_watch_kills', n: 1 }],
    },
    {
      k: 'enemy',
      id: 'haugbui',
      at: { x: 20, y: 16 },
      when: {
        k: 'all',
        of: [
          { k: 'phase', is: 'night' },
          { k: 'flag', id: 'q_rs3_watch' },
          { k: 'not', c: { k: 'flag', id: 'st_barrow_open' } },
        ],
      },
      onDeath: [{ k: 'add', flag: 'q_watch_kills', n: 1 }],
    },
    /** The watch is kept: the door grinds open. */
    {
      k: 'trigger',
      at: { x: 0, y: 0 },
      w: 40,
      h: 22,
      script: 'barrow_open',
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'q_watch_kills', gte: 3 },
          { k: 'not', c: { k: 'flag', id: 'st_barrow_open' } },
        ],
      },
    },
  ],
  map: [
    '##################,,,,##################',
    '#EEEEEEE,,,,,,,,,,,,,,,,,,,,,,,,EEEEEEE#',
    '#EEEEEEE,,,,,,,,NNNNNNNN,,,,,,,,EEEEEEE#',
    '#EEEEEEE,,EEENNNNNNNNNNNNNNEEE,,EEEEEEE#',
    '#EEEiEEE,,EENNNNNNNNNNNNNNNNEE,,EEEEEEE#',
    '#EEEEEEE,,ENNNNNNNNNNNNNNNNNNE,,EEEEEEE#',
    '#EEEEEEE,,ENNNNNNNNNNNNNNNNNNE,,,,,,,,,,',
    '#EEEEEEE,,ENNNNNNNNNNNNNNNNNNE,,,,,,,,,,',
    '#EEEEEEE,,EENNNNNNNNNNNNNNNNEE,,,,,,,,,,',
    '#EEEEEEE,,EEENNNNNNNNNNNNNNEEEEEEEEEEEE#',
    '#EEEEEEE,,EEEEEENNNjjNNNEEEEEEEEEEEEEEE#',
    '#EEEEEEE,,EEEEjjMjjjjjjjjjEEEEEEEEEEEEE#',
    '#EEEEEEE,,EEEEjjjjjjjjjjjjEEEEEEEEEiEEE#',
    '#EEEEEEE,,EEEmjjjjjjjjjjjjmEEEEEEEEEEEE#',
    ',,,,,,,,,,,,,,,jjjjjjjjjjjEEEEEEEEEEEEE#',
    ',,,,,,,,,,,,,,,EEEEEEEEEEEEEEEEEEEEEEEE#',
    ',,,,,,,,,,,,,,,EEEEEmEEEEEEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEiEEEEE#',
    '#EEEEEiEEEEEEEEEEEEEEEEEEEiEEEEEEEEEEEE#',
    '#EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '########################################',
  ],
};
