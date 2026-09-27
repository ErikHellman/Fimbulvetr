import type { EnemyId } from '@content/ids';
import type { Season } from '../clock/types';
import { hashInts, unitFromHash } from '../math/hash';
import type { TilePos } from './screen';

/** One kind of enemy a region's table can put on a spawn point. */
export interface SpawnEntry {
  readonly id: EnemyId;
  readonly weight: number;
  /** Only by day, or only at night; both when missing. */
  readonly time?: 'day' | 'night';
}

/** A region's rolled enemies, per season: how many a screen gets by day (night doubles it) and which. */
export interface SpawnTable {
  readonly count: Readonly<Partial<Record<Season, number>>>;
  readonly entries: Readonly<Partial<Record<Season, readonly SpawnEntry[]>>>;
}

export interface SpawnRoll {
  readonly id: EnemyId;
  readonly at: TilePos;
}

/**
 * Which enemies stand where on a screen: `count` (doubled at night) of the screen's spawn points, shuffled
 * and picked by weight from `seed` alone (the sim folds in the day, the screen and night). Points that
 * `free` rejects are skipped. Pure: it never touches the simulation RNG.
 */
export function rollSpawns(
  table: SpawnTable,
  season: Season,
  night: boolean,
  points: readonly TilePos[],
  seed: number,
  free: (p: TilePos) => boolean,
): SpawnRoll[] {
  const entries = (table.entries[season] ?? []).filter(
    (e) => e.weight > 0 && (e.time === undefined || (e.time === 'night') === night),
  );
  const count = (table.count[season] ?? 0) * (night ? 2 : 1);
  if (entries.length === 0 || count <= 0 || points.length === 0) return [];
  const order = [...points];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(unitFromHash(hashInts(seed, 1000 + i)) * (i + 1));
    const a = order[i];
    const b = order[j];
    if (a === undefined || b === undefined) continue;
    order[i] = b;
    order[j] = a;
  }
  const total = entries.reduce((n, e) => n + e.weight, 0);
  const out: SpawnRoll[] = [];
  for (const at of order) {
    if (out.length >= count) break;
    if (!free(at)) continue;
    const pick = pickWeighted(entries, unitFromHash(hashInts(seed, 100 + out.length)) * total);
    if (pick !== undefined) out.push({ id: pick.id, at });
  }
  return out;
}

function pickWeighted(entries: readonly SpawnEntry[], x: number): SpawnEntry | undefined {
  let left = x;
  for (const e of entries) {
    if (left < e.weight) return e;
    left -= e.weight;
  }
  return entries[entries.length - 1];
}
