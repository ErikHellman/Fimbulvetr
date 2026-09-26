import type { ItemId, ShopId } from '@content/ids';
import type { L10n } from '../i18n/t';
import type { SimRt } from '../sim/rt';
import { evalCond, type Cond, type CondCtx } from './cond';
import { giveItem } from './effects';

export interface ShopDef {
  readonly id: ShopId;
  readonly name: L10n;
  readonly stock: readonly StockEntry[];
}

export interface StockEntry {
  readonly item: ItemId;
  readonly price: number;
  /** How many one purchase gives. */
  readonly n?: number;
  readonly when?: Cond;
}

export type BuyResult = 'ok' | 'poor' | 'owned' | 'full' | 'unknown';

export function visibleStock(shop: ShopDef, ctx: CondCtx): readonly StockEntry[] {
  return shop.stock.filter((s) => evalCond(s.when, ctx));
}

/** Buys one lot of `item`. The shop screen and the `buy` command both come here. */
export function buy(rt: SimRt, shopId: ShopId, item: ItemId): BuyResult {
  const shop = rt.db.shops[shopId];
  const entry =
    shop === undefined
      ? undefined
      : visibleStock(shop, { state: rt.state, quests: rt.db.quests }).find((s) => s.item === item);
  if (entry === undefined) return 'unknown';
  const def = rt.db.items[item];
  const have = rt.state.inv.items[item] ?? 0;
  if (have >= def.max) return def.max === 1 ? 'owned' : 'full';
  if (rt.state.hero.silver < entry.price) return 'poor';
  rt.state.hero.silver -= entry.price;
  giveItem(rt, item, entry.n ?? 1);
  rt.emit({ t: 'sfx', id: 'sfx_buy' });
  return 'ok';
}
