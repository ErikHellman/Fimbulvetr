import type { DropTable } from '../actors/enemies/defs';
import { nextInt, type RngState } from '../math/rng';

export type DropKind = 'heart' | 'silver' | 'seidr' | 'bombs' | 'arrows';

/**
 * Rolls a drop table with the simulation RNG. Tables of all zero never roll (and use no randomness); a
 * table without seiðr jars or bombs draws exactly as before they existed.
 */
export function rollDrop(rng: RngState, table: DropTable): DropKind | null {
  const jars = table.seidr ?? 0;
  const bombs = table.bombs ?? 0;
  const arrows = table.arrows ?? 0;
  const total = table.heart + table.silver + jars + bombs + arrows + table.none;
  if (total <= 0) return null;
  const r = nextInt(rng, 0, total);
  if (r < table.heart) return 'heart';
  if (r < table.heart + table.silver) return 'silver';
  if (r < table.heart + table.silver + jars) return 'seidr';
  if (r < table.heart + table.silver + jars + bombs) return 'bombs';
  if (r < table.heart + table.silver + jars + bombs + arrows) return 'arrows';
  return null;
}
