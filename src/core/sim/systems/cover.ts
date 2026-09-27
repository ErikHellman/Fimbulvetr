import { heroSwordBox } from '../../actors/hero';
import { buildCover, coverAt, cutBox, encodeBits, type CoverGrid } from '../../world/cover';
import type { Box } from '../../math/box';
import { TILE } from '../../world/dims';
import type { SimRt } from '../rt';

export function coverFor(rt: SimRt, id: SimRt['screen']['id']): CoverGrid {
  const c = rt.state.clock;
  return buildCover(
    rt.db.screens[id].map,
    rt.db.coverLegend,
    rt.db.coverOrder,
    rt.db.cover,
    c.season,
    c.epoch,
    rt.state.world.cover[id],
  );
}

/** Regrows the screen's cover when the season (epoch) changed under it. */
export function refreshCover(rt: SimRt): void {
  if (rt.screen.cover.epoch === rt.state.clock.epoch) return;
  rt.screen = { ...rt.screen, cover: coverFor(rt, rt.screen.id) };
  rt.emit({ t: 'coverChanged', screen: rt.screen.id });
}

/** The sword (and the spin) mows standing cover; cut tiles are saved under the season epoch. */
export function cutCover(rt: SimRt): void {
  const box = heroSwordBox(rt.hero, rt.db.tuning, rt.state.inv.weapon);
  if (box !== null) saveCut(rt, cutBox(rt.screen.cover, box));
}

/** The boomerang blows away the light cover it passes (leaf piles), not grass. */
export function blowCover(rt: SimRt, box: Box): void {
  const order = rt.db.coverOrder;
  saveCut(
    rt,
    cutBox(rt.screen.cover, box, (k) => {
      const id = order[k - 1];
      return id !== undefined && rt.db.cover[id].blown === true;
    }),
  );
}

function saveCut(rt: SimRt, cut: readonly number[]): void {
  if (cut.length === 0) return;
  rt.state.world.cover[rt.screen.id] = {
    epoch: rt.screen.cover.epoch,
    cleared: encodeBits(rt.screen.cover.cleared),
  };
  rt.emit({ t: 'coverChanged', screen: rt.screen.id });
  rt.emit({ t: 'sfx', id: 'sfx_cut' });
}

/** Speed factor of the cover under a feet point (1 on bare ground). */
export function coverSpeed(rt: SimRt, x: number, y: number): number {
  const id = coverAt(rt.screen.cover, rt.db.coverOrder, Math.floor(x / TILE), Math.floor((y - 1) / TILE));
  return id === null ? 1 : rt.db.cover[id].slow;
}
