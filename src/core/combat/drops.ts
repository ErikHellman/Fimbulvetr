import type { DropTable } from '../actors/enemies/defs';
import { nextInt, type RngState } from '../math/rng';

export type DropKind = 'heart' | 'silver';

/** Rolls a drop table with the simulation RNG. Tables of all zero never roll (and use no randomness). */
export function rollDrop(rng: RngState, table: DropTable): DropKind | null {
  const total = table.heart + table.silver + table.none;
  if (total <= 0) return null;
  const r = nextInt(rng, 0, total);
  if (r < table.heart) return 'heart';
  if (r < table.heart + table.silver) return 'silver';
  return null;
}
