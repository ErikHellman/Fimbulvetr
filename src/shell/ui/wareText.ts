import { GALDR_DEFS } from '@content/galdr';
import { ARMOR_NAMES, WEAPON_NAMES } from '@content/gear';
import { ITEM_NAMES } from '@content/items';
import { t, type L10n, type Lang } from '@core/i18n/t';
import type { Ware } from '@core/story/shop';

/** The name of a shop ware: an item, a weapon, armour or a galdr. */
export function wareLabel(ware: Ware): L10n {
  if ('item' in ware) return ITEM_NAMES[ware.item];
  if ('weapon' in ware) return WEAPON_NAMES[ware.weapon];
  if ('armor' in ware) return ARMOR_NAMES[ware.armor];
  return GALDR_DEFS[ware.galdr].name;
}

export const wareName = (ware: Ware, lang: Lang): string => t(wareLabel(ware), lang);

/** A stable id for tests: the item, weapon, armour or galdr id. */
export function wareId(ware: Ware): string {
  if ('item' in ware) return ware.item;
  if ('weapon' in ware) return ware.weapon;
  if ('armor' in ware) return ware.armor;
  return ware.galdr;
}
