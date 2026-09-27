import type { FlagId } from '@content/flags';
import type { ItemId, SfxId, WeaponId } from '@content/ids';
import { setMinute, setPolicy, setSeason, sleepUntil } from '../clock/clock';
import type { ClockState, Season } from '../clock/types';
import { dungeonOf } from '../state/dungeons';
import type { FlagValue } from '../state/flags';
import type { SimRt } from '../sim/rt';

/** Silver caps by purse size. */
export const PURSE_CAP = [100, 300, 999] as const;
/** Quarter hearts per heart. */
export const HEART = 4;
/** Twenty hearts at most. */
export const MAX_HP = 20 * HEART;

/** A change to the saved state. Dialogue choices, scripts, triggers and pickups all use it. */
export type Effect =
  | { readonly k: 'set'; readonly flag: FlagId; readonly value: FlagValue }
  | { readonly k: 'add'; readonly flag: FlagId; readonly n: number }
  | { readonly k: 'var'; readonly key: string; readonly value: number }
  | { readonly k: 'give'; readonly item: ItemId; readonly n?: number }
  | { readonly k: 'take'; readonly item: ItemId; readonly n?: number }
  | { readonly k: 'silver'; readonly n: number }
  /** Quarter hearts; 0 or less heals fully. */
  | { readonly k: 'heal'; readonly n: number }
  | { readonly k: 'weapon'; readonly id: WeaponId }
  | { readonly k: 'shield'; readonly has: boolean }
  | { readonly k: 'setSeason'; readonly season: Season }
  | { readonly k: 'setMinute'; readonly minute: number }
  | { readonly k: 'policy'; readonly policy: ClockState['policy'] }
  /** Sleep to the next day's `until` minute. */
  | { readonly k: 'sleep'; readonly until: number }
  | { readonly k: 'sfx'; readonly id: SfxId };

export function applyEffect(e: Effect, rt: SimRt): void {
  const s = rt.state;
  switch (e.k) {
    case 'set':
      s.flags[e.flag] = e.value;
      break;
    case 'add': {
      const spec = rt.db.flags[e.flag];
      const now = s.flags[e.flag];
      const base = typeof now === 'number' ? now : now === true ? 1 : 0;
      const max = spec.t === 'int' ? spec.max : 1;
      const next = Math.max(0, Math.min(max, base + e.n));
      s.flags[e.flag] = spec.t === 'int' ? next : next > 0;
      break;
    }
    case 'var':
      s.world.vars[e.key] = e.value;
      break;
    case 'give':
      giveItem(rt, e.item, e.n ?? 1);
      break;
    case 'take': {
      const left = (s.inv.items[e.item] ?? 0) - (e.n ?? 1);
      if (left > 0) s.inv.items[e.item] = left;
      else {
        s.inv.items = Object.fromEntries(Object.entries(s.inv.items).filter(([id]) => id !== e.item));
        s.inv.slots = [
          s.inv.slots[0] === e.item ? null : s.inv.slots[0],
          s.inv.slots[1] === e.item ? null : s.inv.slots[1],
        ];
      }
      break;
    }
    case 'silver':
      s.hero.silver = Math.max(0, Math.min(PURSE_CAP[s.hero.purse], s.hero.silver + e.n));
      break;
    case 'heal':
      rt.hero.hp = e.n <= 0 ? rt.hero.maxHp : Math.min(rt.hero.maxHp, rt.hero.hp + e.n);
      break;
    case 'weapon':
      s.inv.weapon = e.id;
      break;
    case 'shield':
      s.inv.shield = e.has;
      break;
    case 'setSeason':
      for (const ev of setSeason(s.clock, e.season)) rt.emit({ t: 'clock', e: ev });
      break;
    case 'setMinute':
      setMinute(s.clock, e.minute);
      break;
    case 'policy':
      setPolicy(s.clock, e.policy);
      break;
    case 'sleep':
      for (const ev of sleepUntil(s.clock, rt.db.clock, e.until)) rt.emit({ t: 'clock', e: ev });
      break;
    case 'sfx':
      rt.emit({ t: 'sfx', id: e.id });
      break;
  }
}

/**
 * Adds items, capped by the item's max; slot items go to the first free slot. Dungeon items count in the
 * current room's dungeon instead (outside a dungeon they are lost), and a heart container adds a heart.
 */
export function giveItem(rt: SimRt, item: ItemId, n: number): void {
  const inv = rt.state.inv;
  const def = rt.db.items[item];
  rt.emit({ t: 'itemGet', item });
  if (def.dungeon !== undefined) {
    const id = rt.db.screens[rt.screen.id].dungeon;
    if (id === undefined) return;
    const d = dungeonOf(rt.state, id);
    if (def.dungeon === 'key') d.keys = Math.min(def.max, d.keys + n);
    else d[def.dungeon] = true;
    return;
  }
  if (def.hearts !== undefined) {
    rt.hero.maxHp = Math.min(MAX_HP, rt.hero.maxHp + def.hearts * HEART * n);
    rt.hero.hp = rt.hero.maxHp;
  }
  inv.items[item] = Math.min(def.max, (inv.items[item] ?? 0) + n);
  if (def.slot && !inv.slots.includes(item)) {
    if (inv.slots[0] === null) inv.slots = [item, inv.slots[1]];
    else if (inv.slots[1] === null) inv.slots = [inv.slots[0], item];
  }
}
