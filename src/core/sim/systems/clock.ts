import { tickClock } from '../../clock/clock';
import type { SimRt } from '../rt';

export function tickWorldClock(rt: SimRt, ticksPerMinute: number): void {
  for (const e of tickClock(rt.state.clock, rt.db.clock, ticksPerMinute)) rt.emit({ t: 'clock', e });
}
