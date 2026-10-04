import type { ScreenDef } from '@core/world/screen';

export const saeHolmr: ScreenDef = {
  id: 'sae_holmr',
  region: 'saevatn',
  purpose:
    "Holmr, the island in the lake, ringed by warm water that never freezes: Embla's Refuge, a longhouse among birches with a rune-stone by its door.",
  things: [
    { k: 'door', at: { x: 18, y: 11 }, dir: 'n', to: 'ref_int_hall', arrive: { x: 18, y: 15 }, facing: 'n' },
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
    '~~~~##~~ssssn..RRCRRR..Y...nssss~~~~~~~~',
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
