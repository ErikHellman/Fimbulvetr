import type { ItemId } from '@content/ids';
import { wasPressed, type InputFrame } from '../../input/actions';
import { applyEffect } from '../../story/effects';
import type { SimRt } from '../rt';
import { lightBrazier } from './fixtures';
import { throwBoomerang } from './projectiles';
import { probeBox } from './story';
import { owns } from '../../items/defs';

/** What an item does when its slot button is pressed in play; returns whether it was used. */
export type ItemUse = (rt: SimRt, input: InputFrame) => boolean;

/** Slot items by id. The lantern shines by itself once owned; from a slot it lights braziers. */
const USES: Partial<Record<ItemId, ItemUse>> = {
  lantern: (rt) => lightBrazier(rt, probeBox(rt)),
  boomerang: throwBoomerang,
};

/** Item slot buttons in play: K uses slot 0, L slot 1. Only a hero standing free can use an item. */
export function useItems(rt: SimRt, input: InputFrame): void {
  const s = rt.hero.fsm.s;
  if (s !== 'move' && s !== 'shield') return;
  const slots = rt.state.inv.slots;
  const item = wasPressed(input, 'item1') ? slots[0] : wasPressed(input, 'item2') ? slots[1] : null;
  if (item === null) return;
  USES[item]?.(rt, input);
}

/** Owned sub-items only; an item already in the other slot swaps places. */
export function equip(rt: SimRt, slot: 0 | 1, item: ItemId | null): boolean {
  const inv = rt.state.inv;
  // Ammunition can sit in a slot at 0; anything else must be in hand.
  const def = item === null ? null : rt.db.items[item];
  const held =
    item === null ? false : def?.ammo !== undefined ? owns(inv.items, item) : (inv.items[item] ?? 0) >= 1;
  if (item !== null && (def?.slot !== true || !held)) return false;
  const other = slot === 0 ? 1 : 0;
  const next: [ItemId | null, ItemId | null] = [inv.slots[0], inv.slots[1]];
  if (item !== null && next[other] === item) next[other] = next[slot];
  next[slot] = item;
  inv.slots = next;
  return true;
}

/**
 * Eats food or drinks mead: heals and/or restores seiðr, and uses one up. Refused without one, or when it
 * would restore nothing (full health for food and red mead, a full bar for green mead).
 */
export function eat(rt: SimRt, item: ItemId): boolean {
  const def = rt.db.items[item];
  const have = rt.state.inv.items[item] ?? 0;
  const hero = rt.state.hero;
  const heals = def.heal !== undefined && rt.hero.hp < rt.hero.maxHp;
  const fills = def.seidr !== undefined && hero.seidr < hero.maxSeidr;
  if (have < 1 || (!heals && !fills)) return false;
  if (def.heal !== undefined) rt.hero.hp = Math.min(rt.hero.maxHp, rt.hero.hp + def.heal);
  if (def.seidr !== undefined) hero.seidr = Math.min(hero.maxSeidr, hero.seidr + def.seidr);
  applyEffect({ k: 'take', item }, rt);
  rt.emit({ t: 'sfx', id: def.horn === true ? 'sfx_drink' : 'sfx_itemget' });
  return true;
}
