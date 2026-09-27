import type { L10n } from '@core/i18n/t';
import type { RegionId } from './ids';

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
