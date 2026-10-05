import type { AchievementId } from '@content/ids';

/** How long one achievement's toast stays up, in frames (three seconds). */
export const TOAST_TICKS = 180;

/** Newly earned achievements waiting to be shown, one at a time. */
export interface Toasts {
  readonly shown: AchievementId | null;
  readonly left: number;
  readonly queue: readonly AchievementId[];
}

export const noToasts = (): Toasts => ({ shown: null, left: 0, queue: [] });

export function pushToasts(t: Toasts, ids: readonly AchievementId[]): Toasts {
  if (ids.length === 0) return t;
  const queue = [...t.queue, ...ids];
  if (t.shown !== null) return { ...t, queue };
  return { shown: queue[0] ?? null, left: TOAST_TICKS, queue: queue.slice(1) };
}

export function tickToasts(t: Toasts): Toasts {
  if (t.shown === null) return t;
  if (t.left > 1) return { ...t, left: t.left - 1 };
  const next = t.queue[0] ?? null;
  return { shown: next, left: next === null ? 0 : TOAST_TICKS, queue: t.queue.slice(1) };
}
