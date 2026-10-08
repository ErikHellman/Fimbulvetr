import type { ScreenDef } from '@core/world/screen';

export const dvgChasm: ScreenDef = {
  id: 'dvg_chasm',
  region: 'dvergagrof',
  purpose:
    "The chasm east of Haugar's tarn: a drop with no bottom between the moor and the dwarf country, crossed only by the grapple chain between two posts the miners drove into either lip. Dvergagröf's warp stone stands past it, where the roads to the camp, the scree and the old adit part.",
  things: [
    /** The miners' posts on either lip of the chasm: only the grapple chain crosses. */
    { k: 'post', at: { x: 9, y: 10 } },
    { k: 'post', at: { x: 3, y: 11 } },
    { k: 'warp', region: 'dvergagrof', at: { x: 26, y: 6 }, arrive: { x: 26, y: 7 } },
    {
      k: 'sign',
      at: { x: 2, y: 8 },
      w: 1,
      h: 1,
      text: {
        en: 'Dvergagröf. The dwarves’ holes. Mind the drop, and mind your purse.',
        sv: 'Dvergagröf. Dvärgarnas hålor. Akta stupet, och akta pungen.',
      },
    },
    /** Over the chasm: Ask has reached the dwarf country. */
    {
      k: 'trigger',
      at: { x: 12, y: 8 },
      w: 2,
      h: 6,
      script: 'dvg_arrive',
      when: { k: 'not', c: { k: 'flag', id: 'st_dvg_reached' } },
    },
  ],
  /** Where Dvergagröf's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 30, y: 15 },
    { x: 13, y: 15 },
    { x: 33, y: 5 },
  ],
  map: [
    '##############·,··######################',
    '#####000·······,················########',
    '#####000·P·····,··············PP########',
    '#####000·······,············K·······####',
    '#####000···K···,····················####',
    '#####000·······,·······················#',
    '#####000·······,·······················#',
    '#····000·······,···················K···#',
    '#·M··000·······,·······················#',
    '·····000·······,························',
    ',,,,,000,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '·····000·············,··················',
    '·····000·············,··················',
    '#····000·············,·················#',
    '#····000·············,·················#',
    '#####000·············,···········K·····#',
    '#####000····K········,·················#',
    '#####000·············,···············P·#',
    '#####000··K··········,····K·········P··#',
    '#####000·············,·················#',
    '#####000·············,·················#',
    '####################·,··################',
  ],
};
