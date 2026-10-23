import { mem } from '../../actors/entity';
import type { SimRt } from '../rt';
import { enemyDef } from './movement';

/** A foe that can still fight Ask: not asleep in its grave, not the training dummy. */
function foeAbout(rt: SimRt): boolean {
  return rt.actors.some((a) => a.kind === 'enemy' && mem(a, 'asleep') !== 1 && !enemyDef(rt, a).immortal);
}

/**
 * Seiðr regen: below `Tuning.seidr.floor` (or a smaller full bar) Ask regains a point every `regenTicks`
 * play-ticks, so a dry bar always comes back to one galdr. Above it nothing happens, and with
 * `pauseForFoes` nothing happens while a foe is about (the count starts over). Kept on the runtime
 * only (undefined at or above the floor, so a game that never runs dry never changes the hash).
 */
export function regenSeidr(rt: SimRt): void {
  const hero = rt.state.hero;
  const { regenTicks, floor, pauseForFoes } = rt.db.tuning.seidr;
  if (hero.seidr >= Math.min(floor, hero.maxSeidr) || (pauseForFoes && foeAbout(rt))) {
    rt.seidrTicks = undefined;
    return;
  }
  const next = (rt.seidrTicks ?? 0) + 1;
  if (next < regenTicks) {
    rt.seidrTicks = next;
    return;
  }
  hero.seidr += 1;
  rt.seidrTicks = undefined;
}
