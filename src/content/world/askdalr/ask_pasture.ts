import type { ScreenDef } from '@core/world/screen';
import { afterRaid, all, any, atLeast, not } from '../../dialogue/util';

/** Grazing until the raid scatters the flock; back once the fold is raised again (farm stage 2). */
const GRAZING = any(not(afterRaid), atLeast('q_farm', 2));
/** Hildr's own sheep, down from the heath with her. */
const HILDRS = all(atLeast('q_farm', 2), { k: 'flag', id: 'q_herd_done' });

export const askPasture: ScreenDef = {
  id: 'ask_pasture',
  region: 'askdalr',
  purpose:
    'The sheep meadow and its pen. Day 1: herd the five sheep west through the wide gate of the pen, which fills the west end of the meadow. The raid scatters them; with the fold raised (farm stage 2) they graze here again with Hildr and her flock.',
  things: [
    /** The burned fold's ashes in the pen, until the fold is raised again; Ulf's bell lies in them. */
    {
      k: 'scenery',
      at: { x: 5, y: 9 },
      w: 3,
      h: 1,
      art: 'rubble',
      shown: all(afterRaid, { k: 'flag', id: 'q_farm', lt: 2 }),
    },
    {
      k: 'use',
      at: { x: 5, y: 9 },
      w: 3,
      script: 'find_bell',
      when: all(afterRaid, not({ k: 'item', id: 'trade_bell' }), { k: 'flag', id: 'q_trade', lt: 1 }),
    },
    { k: 'pen', at: { x: 1, y: 1 }, w: 11, h: 20, v: 'ask_pen', flag: 'q_sheep_d1', count: 5 },
    { k: 'critter', id: 'sheep', at: { x: 22, y: 8 }, tag: 0, when: GRAZING },
    { k: 'critter', id: 'sheep', at: { x: 25, y: 11 }, tag: 1, when: GRAZING },
    { k: 'critter', id: 'sheep', at: { x: 28, y: 7 }, tag: 2, when: GRAZING },
    { k: 'critter', id: 'sheep', at: { x: 24, y: 14 }, tag: 3, when: GRAZING },
    { k: 'critter', id: 'sheep', at: { x: 30, y: 12 }, tag: 4, when: GRAZING },
    { k: 'critter', id: 'sheep', at: { x: 18, y: 12 }, when: HILDRS },
    { k: 'critter', id: 'sheep', at: { x: 33, y: 16 }, when: HILDRS },
    { k: 'critter', id: 'sheep', at: { x: 26, y: 18 }, when: HILDRS },
  ],
  map: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'T...........=..........................T',
    'T...........=.................T........T',
    'T...T.......=.....""""""............T..T',
    'T...........=.....""""""...............T',
    'T...........=.....""""""...............T',
    'T...........=..........................T',
    'T...........=..........................T',
    'T......................................T',
    'T................................,,,,,,,',
    'T................................,,,,,,,',
    'T................................,,,,,,,',
    'T................................,,,,,,,',
    'T......................................T',
    'T...........=..........................T',
    'T...........=............."""""""".....T',
    'T...........=............."""""""".....T',
    'T........T..=...""""""....""""""""...T.T',
    'T...........=...""""""...."""""""".....T',
    'T...........=..."""""".................T',
    'T...........=..........................T',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
};
