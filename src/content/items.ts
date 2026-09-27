import type { L10n } from '@core/i18n/t';
import type { DungeonGift, ItemDef } from '@core/items/defs';
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
  small_key: { en: 'Small key', sv: 'Liten nyckel' },
  big_key: { en: 'Great key', sv: 'Stor nyckel' },
  dungeon_map: { en: 'Map', sv: 'Karta' },
  compass: { en: 'Compass', sv: 'Kompass' },
  horn: { en: 'Mead horn', sv: 'Mjödhorn' },
  winter_cloak: { en: 'Winter cloak', sv: 'Vintermantel' },
  charred_stave: { en: 'Charred stave', sv: 'Förkolnad stav' },
  fen_moss: { en: 'Fen-moss', sv: 'Kärrmossa' },
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
  small_key: 9,
  horn: 4,
  fen_moss: 9,
};

/** What a chest says. Items without a line here say "You found: <name>!". */
const FOUND: Partial<Record<ItemId, L10n>> = {
  boomerang: {
    en: 'You found the boomerang! Throw it with its item key. It stuns, strikes far switches and fetches what lies out of reach.',
    sv: 'Du hittade bumerangen! Kasta den med dess föremålsknapp. Den bedövar, träffar avlägsna brytare och hämtar det som ligger utom räckhåll.',
  },
  heart_container: {
    en: 'You found a heart container! Your life grows by one heart.',
    sv: 'Du hittade en hjärtbehållare! Ditt liv växer med ett hjärta.',
  },
  small_key: {
    en: 'You found a small key! It opens one locked door in this place.',
    sv: 'Du hittade en liten nyckel! Den öppnar en låst dörr här inne.',
  },
  big_key: {
    en: 'You found the great key! It opens the way to whatever rules this place.',
    sv: 'Du hittade den stora nyckeln! Den öppnar vägen till det som härskar här.',
  },
  dungeon_map: {
    en: 'You found the map! Open the menu to see every room of this place.',
    sv: 'Du hittade kartan! Öppna menyn för att se alla rum här inne.',
  },
  compass: {
    en: 'You found the compass! The map now marks the chests, and the lair of whatever lurks here.',
    sv: 'Du hittade kompassen! Kartan visar nu kistorna och var det som lurar här har sin lya.',
  },
};

const DUNGEON: Partial<Record<ItemId, DungeonGift>> = {
  small_key: 'key',
  big_key: 'bigKey',
  dungeon_map: 'map',
  compass: 'compass',
};

/** Food heals a heart and a half. */
const HEAL: Partial<Record<ItemId, number>> = { flatbread: 6, cheese: 6 };

export const ITEM_DEFS = Object.fromEntries(
  ITEMS.map((id) => {
    const heal = HEAL[id];
    const dungeon = DUNGEON[id];
    const name = ITEM_NAMES[id];
    const def: ItemDef = {
      name,
      found: FOUND[id] ?? { en: `You found: ${name.en}!`, sv: `Du hittade: ${name.sv}!` },
      slot: (SUB_ITEMS as readonly string[]).includes(id),
      max: MAX[id] ?? 1,
      ...(heal === undefined ? {} : { heal }),
      ...(dungeon === undefined ? {} : { dungeon }),
      ...(id === 'heart_container' ? { hearts: 1 } : {}),
    };
    return [id, def];
  }),
) as Readonly<Record<ItemId, ItemDef>>;
