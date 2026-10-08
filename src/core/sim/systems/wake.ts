import { mem } from '../../actors/entity';
import type { SimRt } from '../rt';

/** The dead wake: every sleeper on the screen rises (grave-gold lifted, a grave-ring laid back). */
export function wakeTheDead(rt: SimRt): void {
  const sleepers = rt.actors.filter((a) => a.kind === 'enemy' && mem(a, 'asleep') === 1);
  if (sleepers.length === 0) return;
  for (const e of sleepers) {
    e.mem['asleep'] = 0;
    e.iframes = 0;
  }
  rt.emit({ t: 'sfx', id: 'sfx_wake' });
}
