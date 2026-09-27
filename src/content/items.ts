import type { L10n } from '@core/i18n/t';
import type { ItemDef } from '@core/items/defs';
import { ITEMS, SUB_ITEMS, type ItemId } from './ids';

export const ITEM_NAMES = {
  lantern: { en: 'Lantern', sv: 'Lykta' },
  boomerang: { en: 'Boomerang', sv: 'Bumerang' },
  bombs: { en: 'Bombs', sv: 'Bomber' },
  bow: { en: 'Bow', sv: 'Pilbåge' },
  sealskin: { en: 'Seal-skin', sv: 'Sälskinn' },
  grapple: { en: 'Grapple chain', sv: 'Änterkedja' },
  hammer: { en: 'Dwarf hammer', sv: 'Dvärghammare' },
  mirror: { en: 'Ice mirror', sv: 'Isspegel' },
  mead_red: { en: 'Red mead', sv: 'Rött mjöd' },
  mead_green: { en: 'Green mead', sv: 'Grönt mjöd' },
  mead_blue: { en: 'Blue mead', sv: 'Blått mjöd' },
  flatbread: { en: "Embla's flatbread", sv: 'Emblas tunnbröd' },
  cheese: { en: 'Cheese', sv: 'Ost' },
  arrows: { en: 'Arrows', sv: 'Pilar' },
  heart_piece: { en: 'Piece of heart', sv: 'Hjärtbit' },
  heart_container: { en: 'Heart container', sv: 'Hjärtbehållare' },
  seidr_upgrade: { en: 'Seiðr vessel', sv: 'Seiðkärl' },
  quiver: { en: 'Larger quiver', sv: 'Större koger' },
  bomb_bag: { en: 'Larger bomb bag', sv: 'Större bombpåse' },
  purse: { en: 'Larger purse', sv: 'Större pung' },
} as const satisfies Record<ItemId, L10n>;

const MAX: Partial<Record<ItemId, number>> = {
  flatbread: 9,
  cheese: 9,
  mead_red: 4,
  mead_green: 4,
  mead_blue: 4,
  arrows: 70,
  heart_piece: 36,
  heart_container: 8,
  seidr_upgrade: 4,
  quiver: 2,
  bomb_bag: 2,
  purse: 2,
};

/** Food heals a heart and a half. */
const HEAL: Partial<Record<ItemId, number>> = { flatbread: 6, cheese: 6 };

export const ITEM_DEFS = Object.fromEntries(
  ITEMS.map((id) => {
    const heal = HEAL[id];
    const def: ItemDef = {
      name: ITEM_NAMES[id],
      slot: (SUB_ITEMS as readonly string[]).includes(id),
      max: MAX[id] ?? 1,
      ...(heal === undefined ? {} : { heal }),
    };
    return [id, def];
  }),
) as Readonly<Record<ItemId, ItemDef>>;
