import type { ScreenDef } from '@core/world/screen';

export const saeNorth: ScreenDef = {
  id: 'sae_north',
  region: 'saevatn',
  purpose: "The north shallows under Uppvík's cliffs: a sand bank, gravel shoals and black rocks.",
  things: [
    {
      k: 'enemy',
      id: 'nykr_foal',
      at: { x: 12, y: 10 },
      when: { k: 'not', c: { k: 'season', is: 'winter' } },
    },
  ],
  /** Where Sævatn's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 28, y: 9 },
    { x: 27, y: 15 },
  ],
  map: [
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~########',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#######',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#######',
    '#~~~~~~~~~~~~~~~~~~~~~~~nnnnnnnnn#######',
    '~~~~~~~~~~~~~~~~~~~~~~~~ynnnnnnnn#######',
    '~~~~~~~~~~~~~~~~~~~~~~~~nnnnnnnKn#######',
    '~~~~~~~~~~~~~~~~~~~~eeeennnnnnnKn#######',
    '~~~~~~~~~~~~~~~~~~~~eeeennnnnnnnn#######',
    '~~~~~~~~##~~~~~~~~~~eeeennnnnnnnn#######',
    '~~~~~~~~~~~~~~~~~~~~eeeennnnnnnnn#######',
    '~~~~~~~~~~~~~~~~~~~~eeeennnnnnnnn#######',
    '~~~~~~~~~~~~~~~~~~~~eeeennnnnnnnn#######',
    '~~~~~~~~~~~~~~~~~~~~eeeennnnnnKKn#######',
    '~~~~~~~~~~~~~~~~~~~~eeeennnnnnnKn#######',
    '~~~~~~~~~~~~~~~~~~~~eeeennnnnnnnn#######',
    '~~~~~~~~~~~~#~~~~~~~~~~~nnnnnnnnn#######',
    '~~~~~~~~~~~~~~~~~~~~~~~~nnnnnnnnn#######',
    '~#########~~~~~~~~~~~~~~ynnnnnnnn#######',
    '~#########~~~~~~~~~~~###################',
    '##########~~~~~~~~~~~###################',
    '##########~~~~~~~~~~~###################',
    '##########~~~~~~~~~~~###################',
  ],
};
