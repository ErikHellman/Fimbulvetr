import { ACHIEVEMENTS, type AchievementId } from '@content/ids';
import type { StorageLike } from './settings';

/** Earned achievements, for this browser across every save slot. */
export const ACHIEVEMENTS_KEY = 'fimbulvetr.achievements.v1';

const known = new Set<string>(ACHIEVEMENTS);

/** The stored id list; anything unknown or malformed is dropped. */
export function parseAchievements(raw: string | null): Set<AchievementId> {
  const out = new Set<AchievementId>();
  if (raw === null) return out;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return out;
  }
  if (!Array.isArray(data)) return out;
  for (const id of data) if (typeof id === 'string' && known.has(id)) out.add(id as AchievementId);
  return out;
}

export function loadAchievements(storage: StorageLike | null): Set<AchievementId> {
  if (storage === null) return new Set();
  try {
    return parseAchievements(storage.getItem(ACHIEVEMENTS_KEY));
  } catch {
    return new Set();
  }
}

export function saveAchievements(storage: StorageLike | null, held: ReadonlySet<AchievementId>): boolean {
  if (storage === null) return false;
  try {
    storage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...held]));
    return true;
  } catch {
    return false;
  }
}
