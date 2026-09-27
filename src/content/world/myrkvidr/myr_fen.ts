import type { ScreenDef } from '@core/world/screen';

export const myrFen: ScreenDef = {
  id: 'myr_fen',
  region: 'myrkvidr',
  purpose:
    "The fen west of the north road: Heiðr the völva's hut (door), black pools and reeds. A heart piece waits on a reed islet behind brambles that only Eldr clears.",
  things: [
    { k: 'door', at: { x: 8, y: 7 }, dir: 'n', to: 'myr_int_volva', arrive: { x: 19, y: 14 }, facing: 'n' },
    /** Brambles across the only way onto the islet: fire clears them. */
    { k: 'prop', id: 'bramble', at: { x: 30, y: 14 } },
    { k: 'piece', id: 'hp_myr_fen', at: { x: 30, y: 16 } },
    /** Fen-moss, for the völva's brews: it grows in autumn and comes back every year. */
    { k: 'herb', id: 'herb_fen_1', item: 'fen_moss', at: { x: 16, y: 9 }, season: 'autumn' },
    { k: 'herb', id: 'herb_fen_2', item: 'fen_moss', at: { x: 22, y: 15 }, season: 'autumn' },
    { k: 'herb', id: 'herb_fen_3', item: 'fen_moss', at: { x: 34, y: 5 }, season: 'autumn' },
  ],
  /** Where the Myrkviðr spawn table may put foes (rolled by day and night, see content/spawns.ts). */
  spawns: [
    { x: 21, y: 10 },
    { x: 26, y: 4 },
    { x: 14, y: 16 },
    { x: 33, y: 10 },
  ],
  map: [
    'PPPPTPPPPPTPPPPPPTPPTPTTPTTTPTTTPPPPPPPT',
    'PPPPPPPPTPPPPTPTPPTPTPTTPPTPPTPTPPTPPPPT',
    'PTPTPTPPPPPTPPTPPPPTPTPPTPPPPTPPPPPTPPPP',
    'PPT.RRRRRRRRR...gggPggggggPPPggPgPgggTPT',
    'TPP.RRCRRRRRR.yg~~~ggggggggggggyggggPPPT',
    'PPP.RRRRRRRRR..~~~~~yggggggggggggggggPPT',
    'PPP.RRRRRRRRR..g~~~gggggg~~~gggggggygPTP',
    'PPP.WW+WDW+WW...gggggggy~~~~~yggggggPTPP',
    'TPP.............ggggggggg~~~gggggggggPPP',
    'PPP.."......""..ggggggggggggggggg.......',
    'PTP...".........gggg...ggggyggggg.......',
    'TPTggggg.ggggggggggg...gggggggggg.......',
    'PPPggggg.............................PPT',
    'TPPgggggg...gggggggg""gggggggg.gggg"PTTP',
    'TPPgggggg...gyggggggggggg~~gyy.yygggPTPP',
    'TPTgggggg...gggggg~~~gggg~~gy...yg~~gTPT',
    'PTPgggggg...ggggy~~~~~ygggggy...y~~~~TPP',
    'PTTPggggg...gggggg~~~gggggggy...yg~~gTPT',
    'TPTgPgggg...gPggggPgPgggggggyyyyygPggTPT',
    'PPPTPPPPPP...PPTTPTTTTPTTPPPTPPPTPPPTPPP',
    'PPPTPPPPTT...TTPTPTPTTPPPPPTTPPTPPPTPPPP',
    'PPPPTPPPTP...PPPPTPTTPPPPTPPPPPTTPTTPPTP',
  ],
};
