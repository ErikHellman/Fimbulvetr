import type { Cond } from '@core/story/cond';
import type { ScreenDef, Thing } from '@core/world/screen';
import { all, atLeast, flag, not } from '../../dialogue/util';

/** Before the snap: Hildr's flock grazes, untagged. */
const GRAZING: Cond = not(flag('st_pass_open'));
/** After it: six tagged sheep, scattered until herded (`q_herd`), then kept in the hurdles until Hildr takes them to Askdalr. */
export const HILDR_MOVED: Cond = all(atLeast('q_farm', 2), flag('q_herd_done'));
const SCATTERED: Cond = all(flag('st_pass_open'), not(HILDR_MOVED));
/** The hurdles, along the pen's top and bottom rows and its east side; the west side stands open. */
const PEN = { x: 14, y: 14, w: 10, h: 6 } as const;

const HURDLES: Thing[] = [
  { k: 'scenery', at: { x: PEN.x, y: PEN.y }, w: PEN.w, h: 1, art: 'hurdle', shown: SCATTERED },
  { k: 'scenery', at: { x: PEN.x, y: PEN.y + PEN.h - 1 }, w: PEN.w, h: 1, art: 'hurdle', shown: SCATTERED },
  {
    k: 'scenery',
    at: { x: PEN.x + PEN.w - 1, y: PEN.y + 1 },
    w: 1,
    h: PEN.h - 2,
    art: 'hurdle',
    shown: SCATTERED,
  },
];

const FLOCK: Thing[] = [
  [10, 9],
  [6, 12],
  [28, 15],
  [30, 18],
  [20, 7],
  [14, 10],
].map(([x = 0, y = 0], tag): Thing => ({ k: 'critter', id: 'sheep', at: { x, y }, tag, when: SCATTERED }));

export const hauHeath: ScreenDef = {
  id: 'hau_heath',
  region: 'haugar',
  purpose:
    "Heather moor above Uppvík's bay (its west edge is a line of cliffs over Uppvík's bay). Hildr grazes her sheep here (after the snap they are scattered, and her herding, q_herd, pens six in the hurdles at 14–23, 14–19); the roads run north to the cairns, east to the stone circle and south to the barrows.",
  things: [
    { k: 'critter', id: 'sheep', at: { x: 14, y: 5 }, when: GRAZING },
    { k: 'critter', id: 'sheep', at: { x: 16, y: 7 }, when: GRAZING },
    { k: 'critter', id: 'sheep', at: { x: 12, y: 7 }, when: GRAZING },
    // Hildr's herding: six sheep into her hurdles before the sand runs out.
    {
      k: 'pen',
      at: { x: PEN.x, y: PEN.y },
      w: PEN.w,
      h: PEN.h,
      v: 'hau_hurdles',
      flag: 'q_herd_penned',
      count: 6,
    },
    ...HURDLES,
    ...FLOCK,
    {
      k: 'trigger',
      at: { x: 0, y: 0 },
      w: 40,
      h: 22,
      script: 'herd_start',
      when: flag('ev_herd_on'),
    },
  ],
  /** Where Haugar's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 30, y: 6 },
    { x: 15, y: 16 },
    { x: 32, y: 17 },
    { x: 6, y: 7 },
  ],
  map: [
    '####################,,,,################',
    '##nEEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEE#',
    '##nEEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEE#',
    '##nEEEEEEEEEEEETEEEE,,,,EEEEEEEEEETEEEE#',
    '##nEEEEEEEEEEEEEEEEE,,,,EEEEEEiEEEEEEEE#',
    '##nEEEKEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEE#',
    '##nEEEEEEEEEEEEEEEEE,,,,EEEKEEEEEEEEEEE#',
    '##nEEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEKEEE#',
    '##nEEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEE#',
    '##nEEEEEEEEEEEEEEEEE,,,,EEEEEEEEEEEEEEE#',
    '##nEEEEE,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '##nEEEEE,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '##nEEEEE,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '##nEEEEE,,,,EEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '##nEEEEE,,,,EEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '##nEEEEE,,,,EEEEEEEEEEEEEEEEEEEEEEEETEE#',
    '##nEEiEE,,,,EEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '##nEEEEE,,,,EKEEEEEEEEEEEEEEEEEEEiEEEEE#',
    '##nEEEEE,,,,EEEEEEEEEEEEEEiEEEEEEEEEEEE#',
    '##nEEEEE,,,,EEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '##nEEEEE,,,,EEEEEEEEEEEEEEEEEEEEEEEEEEE#',
    '########,,,,############################',
  ],
};
