import type { ScreenDef } from '@core/world/screen';

export const saeHolmr: ScreenDef = {
  id: 'sae_holmr',
  region: 'saevatn',
  purpose:
    "Holmr, the island in the lake, ringed by warm water that never freezes: Embla's Refuge, a longhouse among birches with a warp stone by its door.",
  things: [
    { k: 'door', at: { x: 18, y: 11 }, dir: 'n', to: 'ref_int_hall', arrive: { x: 18, y: 15 }, facing: 'n' },
    { k: 'warp', region: 'saevatn', at: { x: 23, y: 9 }, arrive: { x: 23, y: 10 } },
    /** The first landing: Embla is waiting on the shore. */
    {
      k: 'trigger',
      at: { x: 12, y: 19 },
      w: 16,
      h: 2,
      script: 'embla_found',
      when: { k: 'not', c: { k: 'flag', id: 'st_embla_found' } },
    },
  ],
  map: [
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#',
    '~~~~~~~~ssssssssssssssssssssssss~~~~~~~#',
    '~~~~~~~~ssssssssssssssssssssssss~~~~~~~~',
    '~~~~~~~~ssssssssssssssssssssssss~~~~~~~~',
    '~~~~~~~~ssssnnnnnnnnnnnnnnnnssss~~~~~~~~',
    '~~~~~~~~ssssnB............Bnssss~~~~~~~~',
    '~~~~~~~~ssssn..RRRRRR......nssss~~~~~~~~',
    '~~~~##~~ssssn..RRCRRR......nssss~~~~~~~~',
    '~~~~~~~~ssssn..RRRRRR......nssss~~~~~~~~',
    '~~~~~~~~ssssn..WW+DWW....B.nssss~~~~~~~~',
    '~~~~~~~~ssssn.....,........nssss~~~~~~~~',
    '~~~~~~~~ssssn.....,........nssss~~~~~~~~',
    '~~~~~~~~ssssn.....,,,,,,,..nssss~~~~~~~~',
    '~~~~~~~~ssssn.....,........nssss~~~##~~~',
    '~~~~~~~~ssssn.....,........nssss~~~~~~~~',
    '~~~~~~~~ssssn.....,........nssss~~~~~~~~',
    '~~~~~~~~ssssn.....,.......Bnssss~~~~~~~#',
    '~~~~~~~~ssssnB....,........nssss~~~~~~~#',
    '~~~~~~~~ssssn.....,........nssss~~~~~~~#',
    '~~~~~~~~ssss....B...........ssss~~~~~~~#',
  ],
};
