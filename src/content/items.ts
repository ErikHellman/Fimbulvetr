import type { L10n } from '@core/i18n/t';
import type { ItemId } from './ids';

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
