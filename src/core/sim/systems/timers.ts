import type { SimRt } from '../rt';

export function tickTimers(rt: SimRt): void {
  for (const e of [rt.hero, ...rt.actors]) {
    if (e.iframes > 0) e.iframes -= 1;
    if (e.flash > 0) e.flash -= 1;
    e.animT += 1;
  }
}
