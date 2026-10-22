import type { QuestId } from '@content/ids';
import { SIDE_QUESTS } from '@content/quests';
import type { QuestLine } from '@core/story/quests';

/** The quest page lists either the quests still open or the ones done. */
export const QUEST_FILTERS = ['active', 'done'] as const;
export type QuestFilter = (typeof QUEST_FILTERS)[number];

const side = new Set<QuestId>(SIDE_QUESTS);

/** The quests the page shows under `filter`: the story's chapters first, then side quests, each in log order. */
export function questPage(log: readonly QuestLine[], filter: QuestFilter): QuestLine[] {
  const shown = log.filter((q) => q.done === (filter === 'done'));
  return [...shown.filter((q) => !side.has(q.id)), ...shown.filter((q) => side.has(q.id))];
}

/** How many quests each filter holds, for the page's header. */
export function questCounts(log: readonly QuestLine[]): Record<QuestFilter, number> {
  const done = log.filter((q) => q.done).length;
  return { active: log.length - done, done };
}

/** The first row of a window of `rows` lines that keeps `cursor` in view, from a list of `n`. */
export function scrollTop(cursor: number, n: number, rows: number): number {
  return Math.max(0, Math.min(cursor - Math.floor(rows / 2), n - rows));
}
