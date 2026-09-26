import type { Cond } from '@core/story/cond';
import type { DialogueDef, DNode } from '@core/story/dialogue';
import type { FlagId } from '../flags';

/** Shorthands for writing dialogue conditions. */
export const day = (n: 1 | 2 | 3): Cond => ({ k: 'flag', id: 'st_farm_day', eq: n });
export const flag = (id: FlagId): Cond => ({ k: 'flag', id });
export const not = (c: Cond): Cond => ({ k: 'not', c });
export const all = (...of: Cond[]): Cond => ({ k: 'all', of });
export const any = (...of: Cond[]): Cond => ({ k: 'any', of });
export const atLeast = (id: FlagId, n: number): Cond => ({ k: 'flag', id, gte: n });
export const evening: Cond = { k: 'phase', is: ['evening', 'night'] };
export const daytime: Cond = { k: 'phase', is: ['morning', 'day'] };
export const raid: Cond = { k: 'flag', id: 'st_raid_begun' };

/** The day's chore is done (not yet paid). */
export const choresDone = (n: 1 | 2 | 3): Cond =>
  n === 1
    ? all(flag('q_sheep_d1'), flag('q_water_d1'))
    : n === 2
      ? atLeast('q_logs', 5)
      : atLeast('q_ravens', 5);

export const paid = (n: 1 | 2 | 3): FlagId => (n === 1 ? 'q_paid_d1' : n === 2 ? 'q_paid_d2' : 'q_paid_d3');
export const eve = (n: 1 | 2 | 3): FlagId =>
  n === 1 ? 'ev_embla_d1' : n === 2 ? 'ev_embla_d2' : 'ev_embla_d3';

/** Embla's evening scene for day n is due: paid for the day, scene not yet played. */
export const eveningDue = (n: 1 | 2 | 3): Cond => all(day(n), flag(paid(n)), not(flag(eve(n))));

type Line = { readonly en: string; readonly sv: string };

/**
 * A villager who says one thing per farm day, with an optional second line, and one thing once the raid
 * has begun. Enough for the prologue; later milestones give people richer graphs.
 */
export function daily(d1: Line[], d2: Line[], d3: Line[], afterRaid: Line): DialogueDef {
  const nodes: Record<string, DNode> = { raid: { text: afterRaid } };
  const chain = (key: string, lines: Line[]): void => {
    lines.forEach((text, i) => {
      nodes[`${key}_${String(i)}`] =
        i + 1 < lines.length ? { text, next: `${key}_${String(i + 1)}` } : { text };
    });
  };
  chain('d1', d1);
  chain('d2', d2);
  chain('d3', d3);
  return {
    entry: [
      { when: raid, node: 'raid' },
      { when: day(1), node: 'd1_0' },
      { when: day(2), node: 'd2_0' },
      { when: day(3), node: 'd3_0' },
    ],
    nodes,
  };
}
