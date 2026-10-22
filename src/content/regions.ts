import type { L10n } from '@core/i18n/t';
import type { DungeonId, RegionId } from './ids';

/** Region names for the map. Old Norse names are kept in both languages. */
export const REGION_NAMES = {
  askdalr: { en: 'Askdalr', sv: 'Askdalr' },
  myrkvidr: { en: 'Myrkviðr', sv: 'Myrkviðr' },
  myrland: { en: 'Mýrland', sv: 'Mýrland' },
  haugar: { en: 'Haugar', sv: 'Haugar' },
  niflmyrr: { en: 'Niflmýrr', sv: 'Niflmýrr' },
  saevatn: { en: 'Sævatn', sv: 'Sævatn' },
  dvergagrof: { en: 'Dvergagröf', sv: 'Dvergagröf' },
  hrimfjoll: { en: 'Hrímfjöll', sv: 'Hrímfjöll' },
} as const satisfies Record<RegionId, L10n>;

/** Where a quest step happens, for the quest log: the regions, and the towns and halls inside them. */
export const PLACE_NAMES = {
  ...REGION_NAMES,
  uppvik: { en: 'Uppvík', sv: 'Uppvík' },
  holmr: { en: 'Holmr', sv: 'Holmr' },
  rotarhellir: { en: 'Rótarhellir', sv: 'Rótarhellir' },
  sokkva_kvern: { en: 'Sökkva Kvern', sv: 'Sökkva Kvern' },
  konungshaugr: { en: 'Konungshaugr', sv: 'Konungshaugr' },
  helgrind: { en: 'Helgrind', sv: 'Helgrind' },
  sokkva_hof: { en: 'Sökkva Hof', sv: 'Sökkva Hov' },
  forge: { en: 'Ívaldi’s Forge', sv: 'Ívaldis smedja' },
  hrimturn: { en: 'Hrímturn', sv: 'Hrímturn' },
  utgard: { en: 'Útgarðr', sv: 'Útgarðr' },
} as const satisfies Record<string, L10n>;

/** Dungeon names for the map and the HUD. Old Norse names are kept in both languages. */
export const DUNGEON_NAMES = {
  d1: { en: 'Rótarhellir', sv: 'Rótarhellir' },
  d2: { en: 'Sökkva Kvern', sv: 'Sökkva Kvern' },
  d3: { en: 'Konungshaugr', sv: 'Konungshaugr' },
  d4: { en: 'Helgrind', sv: 'Helgrind' },
  d5: { en: 'Sökkva Hof', sv: 'Sökkva Hov' },
  d6: { en: 'The sixth hall', sv: 'Den sjätte salen' },
  d7: { en: 'The seventh hall', sv: 'Den sjunde salen' },
  d8: { en: 'The eighth hall', sv: 'Den åttonde salen' },
} as const satisfies Record<DungeonId, L10n>;

/** Map colours per region (placeholder palette). */
export const REGION_COLOURS: Readonly<Record<RegionId, number>> = {
  askdalr: 0x7fa650,
  myrkvidr: 0x3f6b3a,
  myrland: 0x5f8f7a,
  haugar: 0x8f8f5a,
  niflmyrr: 0x6a7a80,
  saevatn: 0x4f7faf,
  dvergagrof: 0x8a6a50,
  hrimfjoll: 0xc8d8e8,
};
