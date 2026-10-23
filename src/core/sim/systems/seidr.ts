import type { SimRt } from '../rt';

/**
 * Seiðr regen: below `Tuning.seidr.floor` (or a smaller full bar) Ask regains a point every `regenTicks`
 * play-ticks, so a dry bar always comes back to one galdr. Above it nothing happens. Kept on the runtime
 * only (undefined at or above the floor, so a game that never runs dry never changes the hash).
 */
export function regenSeidr(rt: SimRt): void {
  const hero = rt.state.hero;
  const { regenTicks, floor } = rt.db.tuning.seidr;
  if (hero.seidr >= Math.min(floor, hero.maxSeidr)) {
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
