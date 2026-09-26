import type { FlagSpec } from '@core/state/flags';

/** Story and world flags. Prefixes: st_ story, q_ quest, w_ world, n_ npc, ev_ event. */
export const FLAGS = {
  st_intro_seen: { t: 'bool' },
} as const satisfies Record<string, FlagSpec>;

export type FlagId = keyof typeof FLAGS;

export const isFlagId = (s: string): s is FlagId => Object.hasOwn(FLAGS, s);
