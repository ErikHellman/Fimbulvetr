import type { DrawnFrame } from '../lib/sprite';
import { caveFrames } from './cave';
import { fenFrames } from './fen';
import { forgeFoeFrames } from './forge';
import { helgrindFrames } from './helgrind';
import { hofFrames } from './hof';
import { niflmyrrFrames } from './niflmyrr';
import { passFrames } from './pass';
import { rimeFoeFrames } from './rime';
import { towerFrames } from './tower';
import { utgardFoeFrames } from './utgard';
import { millFrames } from './mill';
import { wightFrames } from './wights';

/** The dungeons' foes under their placeholder names: the `dungeon` atlas. */
export function dungeonFrames(): DrawnFrame[] {
  return [
    ...caveFrames(),
    ...millFrames(),
    ...wightFrames(),
    ...fenFrames(),
    ...hofFrames(),
    ...helgrindFrames(),
    ...niflmyrrFrames(),
    ...passFrames(),
    ...forgeFoeFrames(),
    ...rimeFoeFrames(),
    ...towerFrames(),
    ...utgardFoeFrames(),
  ];
}
