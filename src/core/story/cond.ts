import type { FlagId } from '@content/flags';
import type { GaldrId, ItemId, QuestId, WeaponId } from '@content/ids';
import type { Season, WeatherKind } from '../clock/types';
import type { FlagValue } from '../state/flags';
import type { GameState } from '../state/gameState';
import type { QuestDef } from './quests';

/** Parts of the day, by clock minute: morning 05–10, day 10–18, evening 18–22, night 22–05. */
export type Phase = 'morning' | 'day' | 'evening' | 'night';

/** A condition over the saved state. Dialogue, NPC placement, triggers, shops and quests all use it. */
export type Cond =
  | {
      readonly k: 'flag';
      readonly id: FlagId;
      readonly eq?: FlagValue;
      readonly gte?: number;
      readonly lt?: number;
    }
  | { readonly k: 'item'; readonly id: ItemId; readonly gte?: number }
  /** Owned at all, even at 0 (ammunition used up). */
  | { readonly k: 'owns'; readonly id: ItemId }
  | { readonly k: 'silver'; readonly gte: number }
  | { readonly k: 'quest'; readonly id: QuestId; readonly gte: number }
  | { readonly k: 'season'; readonly is: Season }
  | { readonly k: 'phase'; readonly is: Phase | readonly Phase[] }
  | { readonly k: 'weapon'; readonly is: WeaponId }
  /** A galdr Ask knows. */
  | { readonly k: 'galdr'; readonly id: GaldrId }
  /** The sky over the current region (indoors too: an NPC goes in because it rains outside). */
  | { readonly k: 'weather'; readonly is: WeatherKind | readonly WeatherKind[] }
  | { readonly k: 'all'; readonly of: readonly Cond[] }
  | { readonly k: 'any'; readonly of: readonly Cond[] }
  | { readonly k: 'not'; readonly c: Cond };

export interface CondCtx {
  readonly state: GameState;
  readonly quests: Readonly<Partial<Record<QuestId, QuestDef>>>;
  /** The sky, read lazily (only `weather` conditions pay for it); missing means clear. */
  readonly weather?: () => WeatherKind;
}

export function phaseOf(minute: number): Phase {
  const h = Math.floor(minute / 60);
  if (h >= 5 && h < 10) return 'morning';
  if (h >= 10 && h < 18) return 'day';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
}

const num = (v: FlagValue | undefined): number => (v === true ? 1 : typeof v === 'number' ? v : 0);

/** A missing condition always holds. */
export function evalCond(c: Cond | undefined, ctx: CondCtx): boolean {
  if (c === undefined) return true;
  const s = ctx.state;
  switch (c.k) {
    case 'flag': {
      const v = s.flags[c.id];
      if (c.eq !== undefined) return typeof c.eq === 'number' ? num(v) === c.eq : (v ?? false) === c.eq;
      if (c.gte === undefined && c.lt === undefined) return num(v) > 0;
      return (c.gte === undefined || num(v) >= c.gte) && (c.lt === undefined || num(v) < c.lt);
    }
    case 'item':
      return (s.inv.items[c.id] ?? 0) >= (c.gte ?? 1);
    case 'owns':
      return Object.hasOwn(s.inv.items, c.id);
    case 'silver':
      return s.hero.silver >= c.gte;
    case 'quest': {
      const q = ctx.quests[c.id];
      return q !== undefined && questStage(q, ctx) >= c.gte;
    }
    case 'season':
      return s.clock.season === c.is;
    case 'phase': {
      const p = phaseOf(s.clock.minute);
      return typeof c.is === 'string' ? p === c.is : c.is.includes(p);
    }
    case 'weapon':
      return s.inv.weapon === c.is;
    case 'galdr':
      return s.inv.galdr.includes(c.id);
    case 'weather': {
      const w = ctx.weather?.() ?? 'clear';
      return typeof c.is === 'string' ? w === c.is : c.is.includes(w);
    }
    case 'all':
      return c.of.every((x) => evalCond(x, ctx));
    case 'any':
      return c.of.some((x) => evalCond(x, ctx));
    case 'not':
      return !evalCond(c.c, ctx);
  }
}

/** The last stage whose `when` holds, or -1 before the quest starts. */
export function questStage(q: QuestDef, ctx: CondCtx): number {
  let stage = -1;
  q.stages.forEach((st, i) => {
    if (evalCond(st.when, ctx)) stage = i;
  });
  return stage;
}
