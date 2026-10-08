import type { FlagId } from '@content/flags';

/** `dawn`: the flag marks something done for one night or day, and clears at sunrise and on waking. */
export type FlagSpec =
  { readonly t: 'bool'; readonly dawn?: true } | { readonly t: 'int'; readonly max: number };
export type FlagValue = boolean | number;
export type Flags = Partial<Record<FlagId, FlagValue>>;

/** True for `true` and for positive integers. */
export function isSet(flags: Flags, id: FlagId): boolean {
  const v = flags[id];
  return v === true || (typeof v === 'number' && v > 0);
}
