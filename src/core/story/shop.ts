import type { ArmorId, GaldrId, ItemId, ShopId, WeaponId } from '@content/ids';
import type { L10n } from '../i18n/t';
import type { SimRt } from '../sim/rt';
import { evalCond, type Cond, type CondCtx } from './cond';
import { giveItem, hornsFree } from './effects';
import { itemMax } from '../items/defs';

export interface ShopDef {
  readonly id: ShopId;
  readonly name: L10n;
  readonly stock: readonly StockEntry[];
}

/** What a shop sells: an item into the bag, or a weapon, armour or galdr straight onto Ask. */
export type Ware =
  | { readonly item: ItemId }
  | { readonly weapon: WeaponId }
  | { readonly armor: ArmorId }
  | { readonly galdr: GaldrId };

export type StockEntry = Ware & {
  readonly price: number;
  /** How many one purchase gives (items only). */
  readonly n?: number;
  readonly when?: Cond;
};

/** Just the ware of a stock entry (without price or condition). */
export function wareOf(entry: StockEntry): Ware {
  if ('item' in entry) return { item: entry.item };
  if ('weapon' in entry) return { weapon: entry.weapon };
  if ('armor' in entry) return { armor: entry.armor };
  return { galdr: entry.galdr };
}

/** What a ware costs Ask now: the arm-ring of thrift takes its share off, rounded up. */
export function priceOf(rt: SimRt, price: number): number {
  return rt.state.inv.ring === 'ring_thrift' ? Math.ceil(price * rt.db.tuning.rings.thriftPrice) : price;
}

export type BuyResult = 'ok' | 'poor' | 'owned' | 'full' | 'unknown';

export function visibleStock(shop: ShopDef, ctx: CondCtx): readonly StockEntry[] {
  return shop.stock.filter((s) => evalCond(s.when, ctx));
}

const stockOf = (rt: SimRt, shopId: ShopId): readonly StockEntry[] => {
  const shop = rt.db.shops[shopId];
  return shop === undefined ? [] : visibleStock(shop, { state: rt.state, quests: rt.db.quests });
};

/** Buys one lot of `item` (the dev `buy` command). */
export function buy(rt: SimRt, shopId: ShopId, item: ItemId): BuyResult {
  const entry = stockOf(rt, shopId).find((s) => 'item' in s && s.item === item);
  return entry === undefined ? 'unknown' : purchase(rt, entry);
}

/** Buys the shop screen's row `index` (of the visible stock). */
export function buyRow(rt: SimRt, shopId: ShopId, index: number): BuyResult {
  const entry = stockOf(rt, shopId)[index];
  return entry === undefined ? 'unknown' : purchase(rt, entry);
}

/** Why a ware cannot be taken now, or null when it can. */
function refusal(rt: SimRt, entry: StockEntry): BuyResult | null {
  const inv = rt.state.inv;
  if ('weapon' in entry) return inv.weapon === entry.weapon ? 'owned' : null;
  if ('armor' in entry) {
    // Armour that already takes as much off a blow counts as owned.
    const worn = rt.db.tuning.armor;
    return worn[inv.armor].reduce >= worn[entry.armor].reduce ? 'owned' : null;
  }
  if ('galdr' in entry) return inv.galdr.includes(entry.galdr) ? 'owned' : null;
  const def = rt.db.items[entry.item];
  const max = itemMax(rt.db.items, inv.items, entry.item);
  if ((inv.items[entry.item] ?? 0) >= max) return max === 1 ? 'owned' : 'full';
  if (def.horn === true && hornsFree(rt) <= 0) return 'full';
  return null;
}

function purchase(rt: SimRt, entry: StockEntry): BuyResult {
  const no = refusal(rt, entry);
  if (no !== null) return no;
  const price = priceOf(rt, entry.price);
  if (rt.state.hero.silver < price) return 'poor';
  rt.state.hero.silver -= price;
  const inv = rt.state.inv;
  if ('item' in entry) giveItem(rt, entry.item, entry.n ?? 1);
  else if ('weapon' in entry) inv.weapon = entry.weapon;
  else if ('armor' in entry) inv.armor = entry.armor;
  else inv.galdr.push(entry.galdr);
  rt.emit({ t: 'sfx', id: 'sfx_buy' });
  return 'ok';
}
