import { tickClock } from '../../clock/clock';
import { evalCond } from '../../story/cond';
import type { SimRt } from '../rt';
import { condCtx } from './story';

/** Advances the world clock, unless the content freezes it (a story night that must not end). */
export function tickWorldClock(rt: SimRt, ticksPerMinute: number): void {
  // Time stands still underground: dungeons have no clock.
  if (rt.db.screens[rt.screen.id].dungeon !== undefined) return;
  if (rt.db.freezeClock !== undefined && evalCond(rt.db.freezeClock, condCtx(rt))) return;
  for (const e of tickClock(rt.state.clock, rt.db.clock, ticksPerMinute)) rt.emit({ t: 'clock', e });
}
