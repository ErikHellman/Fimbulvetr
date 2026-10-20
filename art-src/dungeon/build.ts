import type { DrawnFrame } from '../lib/sprite';
import { caveFrames } from './cave';
import { fenFrames } from './fen';
import { millFrames } from './mill';
import { wightFrames } from './wights';

/** The dungeons' foes under their placeholder names: the `dungeon` atlas. */
export function dungeonFrames(): DrawnFrame[] {
  return [...caveFrames(), ...millFrames(), ...wightFrames(), ...fenFrames()];
}
