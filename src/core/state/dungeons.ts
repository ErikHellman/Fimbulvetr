import type { DungeonId } from '@content/ids';
import type { DungeonState, GameState } from './gameState';

/** A dungeon nobody has entered: no keys, no map, doors all locked. */
export function emptyDungeon(): DungeonState {
  return { keys: 0, bigKey: false, map: false, compass: false, bossDead: false, doors: [] };
}

/** A dungeon's saved state for reading only: an untouched dungeon reads as empty, and nothing is stored. */
export function peekDungeon(state: GameState, id: DungeonId): DungeonState {
  const found = state.dungeons[id] as DungeonState | undefined;
  return found ?? emptyDungeon();
}

/**
 * A dungeon's saved state, created on first use. The validator accepts saves whose `dungeons` record lacks
 * an id (core cannot list the ids at runtime), so every read goes through here instead of indexing.
 */
export function dungeonOf(state: GameState, id: DungeonId): DungeonState {
  const found = state.dungeons[id] as DungeonState | undefined;
  if (found !== undefined) return found;
  const fresh = emptyDungeon();
  state.dungeons[id] = fresh;
  return fresh;
}
