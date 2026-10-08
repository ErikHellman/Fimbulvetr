import type { FlagId } from '@content/flags';
import { tickClock } from '../../clock/clock';
import type { FlagSpec } from '../../state/flags';
import { evalCond } from '../../story/cond';
import type { SimRt } from '../rt';
import { condCtx } from './story';

/** Advances the world clock, unless the content freezes it (a story night that must not end). */
export function tickWorldClock(rt: SimRt, ticksPerMinute: number): void {
  // Time stands still underground: dungeons have no clock.
  if (rt.db.screens[rt.screen.id].dungeon !== undefined) return;
  if (rt.db.freezeClock !== undefined && evalCond(rt.db.freezeClock, condCtx(rt))) return;
  for (const e of tickClock(rt.state.clock, rt.db.clock, ticksPerMinute)) {
    if (e.t === 'dawn') clearDawnFlags(rt);
    rt.emit({ t: 'clock', e });
  }
}

/** Clears every flag marked `dawn`: what was done for one night or day may be done again. */
export function clearDawnFlags(rt: SimRt): void {
  for (const [id, spec] of Object.entries(rt.db.flags) as [FlagId, FlagSpec][])
    if (spec.t === 'bool' && spec.dawn === true && rt.state.flags[id] === true) rt.state.flags[id] = false;
}
