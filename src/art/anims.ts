import type { Dir4 } from '@core/math/dir';

export interface AnimDef {
  readonly frames: number;
  readonly fps: number;
  readonly loop: boolean;
  /** Directions drawn for this animation; others fall back to the first. */
  readonly dirs: readonly Dir4[];
}

/** art key → animation name → definition. */
export type AnimTable = Readonly<Record<string, Readonly<Record<string, AnimDef>>>>;

export const frameName = (art: string, anim: string, dir: Dir4, i: number): string =>
  `${art}_${anim}_${dir}_${i}`;

/** Frame to show for an entity; `animT` counts 60 Hz ticks since the animation started. */
export function frameFor(table: AnimTable, art: string, anim: string, facing: Dir4, animT: number): string {
  const def = table[art]?.[anim];
  if (def === undefined) return `${art}_${anim}_missing`;
  const dir = def.dirs.includes(facing) ? facing : (def.dirs[0] ?? 's');
  const step = Math.floor((animT * def.fps) / 60);
  const i = def.loop ? step % def.frames : Math.min(def.frames - 1, step);
  return frameName(art, anim, dir, i);
}
