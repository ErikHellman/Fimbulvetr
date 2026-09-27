import type { ItemId } from '@content/ids';
import { wasPressed, type InputFrame } from '../../input/actions';
import { applyEffect } from '../../story/effects';
import type { SimRt } from '../rt';
import { lightBrazier } from './fixtures';
import { probeBox } from './story';

/** What an item does when its slot button is pressed in play; returns whether it was used. */
export type ItemUse = (rt: SimRt) => boolean;

/** Slot items by id. The lantern shines by itself once owned; from a slot it lights braziers. */
const USES: Partial<Record<ItemId, ItemUse>> = {
  lantern: (rt) => lightBrazier(rt, probeBox(rt)),
};

/** Item slot buttons in play: K uses slot 0, L slot 1. Only a hero standing free can use an item. */
export function useItems(rt: SimRt, input: InputFrame): void {
  const s = rt.hero.fsm.s;
  if (s !== 'move' && s !== 'shield') return;
  const slots = rt.state.inv.slots;
  const item = wasPressed(input, 'item1') ? slots[0] : wasPressed(input, 'item2') ? slots[1] : null;
  if (item === null) return;
  USES[item]?.(rt);
}

/** Owned sub-items only; an item already in the other slot swaps places. */
export function equip(rt: SimRt, slot: 0 | 1, item: ItemId | null): boolean {
  const inv = rt.state.inv;
  if (item !== null && (!rt.db.items[item].slot || (inv.items[item] ?? 0) < 1)) return false;
  const other = slot === 0 ? 1 : 0;
  const next: [ItemId | null, ItemId | null] = [inv.slots[0], inv.slots[1]];
  if (item !== null && next[other] === item) next[other] = next[slot];
  next[slot] = item;
  inv.slots = next;
  return true;
}

/** Eats one of a food item: heals, uses it up. Refused at full health or without one. */
export function eat(rt: SimRt, item: ItemId): boolean {
  const heal = rt.db.items[item].heal;
  const have = rt.state.inv.items[item] ?? 0;
  if (heal === undefined || have < 1 || rt.hero.hp >= rt.hero.maxHp) return false;
  rt.hero.hp = Math.min(rt.hero.maxHp, rt.hero.hp + heal);
  applyEffect({ k: 'take', item }, rt);
  rt.emit({ t: 'sfx', id: 'sfx_itemget' });
  return true;
}
