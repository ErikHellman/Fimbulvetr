import type { ScreenDef } from '@core/world/screen';

export const saeNorth: ScreenDef = {
  id: 'sae_north',
  region: 'saevatn',
  purpose:
    "The north shallows under Uppvík's cliffs: a sand bank, gravel shoals, and black rock in the cliff foot with ore behind it.",
  things: [
    /** Black rock over two nooks in the cliff: a bomb breaks it, and ore lies behind. */
    { k: 'crack', id: 'sae_k_ore1', at: { x: 33, y: 8 }, w: 1, h: 1, art: 'rock' },
    { k: 'chest', id: 'sae_c_ore1', at: { x: 34, y: 8 }, gives: { item: 'ore', n: 3 } },
    { k: 'crack', id: 'sae_k_ore2', at: { x: 33, y: 13 }, w: 1, h: 1, art: 'rock' },
    { k: 'chest', id: 'sae_c_ore2', at: { x: 34, y: 13 }, gives: { item: 'ore', n: 3 } },
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
    '~~~~~~~~##~~~~~~~~~~eeeennnnnnnnnnn#####',
    '~~~~~~~~~~~~~~~~~~~~eeeennnnnnnnn#######',
    '~~~~~~~~~~~~~~~~~~~~eeeennnnnnnnn#######',
    '~~~~~~~~~~~~~~~~~~~~eeeennnnnnnnn#######',
    '~~~~~~~~~~~~~~~~~~~~eeeennnnnnKKn#######',
    '~~~~~~~~~~~~~~~~~~~~eeeennnnnnnKnnn#####',
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
