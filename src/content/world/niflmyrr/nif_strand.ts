import type { ScreenDef } from '@core/world/screen';
import { all, flag, not } from '../../dialogue/util';

export const nifStrand: ScreenDef = {
  id: 'nif_strand',
  region: 'niflmyrr',
  purpose:
    "The north strand: dead reeds, pale sand and a fisher's boat rotting where the lake left it. Sævatn goes out grey to the west; in winter its ice reaches the shore.",
  things: [
    /** A wisp ember for Heiðr (`q_ljos`), drifting here at night until it is caught. */
    {
      k: 'prop',
      id: 'wisp_ember',
      at: { x: 34, y: 8 },
      when: all({ k: 'phase', is: 'night' }, flag('q_ljos_asked'), not(flag('w_ember_strand'))),
      onBreak: [{ k: 'set', flag: 'w_ember_strand', value: true }],
    },
  ],
  /** Where Niflmýrr's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 27, y: 12 },
    { x: 34, y: 9 },
    { x: 24, y: 9 },
  ],
  map: [
    '########################################',
    '#~~~~~~~~~~~~nnnnn****6*******##########',
    '#~~~~~~~~~~~~nnnnnn*****y**y*****#######',
    '#~~~~~~~~~~~nnnnnnn***y****y*****6######',
    '#~~~~~~~~~~~~nnnnnn*****yy*********#####',
    '#~~~~~~~~~~~~~nnnnn**y******6*******####',
    '#~~~~~~~~~~~~~nnAAAn***y******y******###',
    '#~~~~~~~~~~~~nnnnnnn****y************###',
    '#~~~~~~~~~~~~nnnnnnn*******6**********##',
    '#~~~~~~~~~~~nnnnnnnn**y********y*******#',
    '#~~~~~~~~~~~nnnnnnnnn*******************',
    '#~~~~~~~~~~nnnnnnnnnn****y**************',
    '#~~~~~~~~~~~nnnnnnnnn***********6*******',
    '#~~~~~~~~~~~~nnnnnnn**6*****************',
    '#~~~~~~~~~~~~~nnnnnn*********y*********#',
    '#~~~~~~~~~~~~~~nnnnn****y**************#',
    '#~~~~~~~~~~~~~~nnnnn*********6*********#',
    '#~~~~~~~~~~~~~~~nnnn******y***********##',
    '#~~~~~~~~~~~~~~~~nnn**6***************##',
    '#~~~~~~~~~~~~~~~~~nnn***********6****###',
    '#~~~~~~~~~~~~~~~~~~nnn**************####',
    '########################################',
  ],
};
