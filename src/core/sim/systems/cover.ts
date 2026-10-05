import type { CoverId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import { heroSwordBox } from '../../actors/hero';
import type { Entity } from '../../actors/entity';
import { seasonAt } from '../../clock/clock';
import { buildCover, coverAt, cutBox, encodeBits, type CoverGrid } from '../../world/cover';
import { at, type Box } from '../../math/box';
import type { Vec } from '../../math/vec';
import { TILE } from '../../world/dims';
import type { SimRt } from '../rt';
import { stampCollision } from './fixtures';
import { wetDay } from './weather';

export function coverFor(rt: SimRt, id: ScreenId): CoverGrid {
  const c = rt.state.clock;
  const def = rt.db.screens[id];
  return buildCover(
    def.map,
    rt.db.coverLegend,
    rt.db.coverOrder,
    rt.db.cover,
    seasonAt(c, def.region, rt.db.clock),
    c.epoch,
    rt.state.world.cover[id],
    {
      terrain: rt.terrainOf(id),
      outdoor: def.indoor !== true && def.dungeon === undefined,
      wet: wetDay(rt, id),
    },
  );
}

/** Whether a cover kind (1 + index into the cover list) passes a test on its def. */
function kindIs(
  rt: SimRt,
  k: number,
  test: (id: NonNullable<SimRt['db']['coverOrder'][number]>) => boolean,
): boolean {
  const id = rt.db.coverOrder[k - 1];
  return id !== undefined && test(id);
}

/** Regrows the screen's cover when the season (epoch) turned or the day turned wet or dry under it. */
export function refreshCover(rt: SimRt): void {
  const cover = rt.screen.cover;
  if (cover.epoch === rt.state.clock.epoch && cover.wet === wetDay(rt, rt.screen.id)) return;
  const next = coverFor(rt, rt.screen.id);
  keepIceUnderfoot(rt, cover, next);
  holdFloodOff(rt, next, rt.hero.pos);
  rt.screen = { ...rt.screen, cover: next };
  stampCollision(rt);
  rt.emit({ t: 'coverChanged', screen: rt.screen.id });
}

/** Tile indices under Ask's feet (standing at `pos`). */
function feetTiles(rt: SimRt, g: CoverGrid, pos: Vec = rt.hero.pos): number[] {
  const feet = at(rt.hero.body, pos);
  const x0 = Math.floor(feet.x / TILE);
  const x1 = Math.floor((feet.x + feet.w - 1e-6) / TILE);
  const y0 = Math.floor(feet.y / TILE);
  const y1 = Math.floor((feet.y + feet.h - 1e-6) / TILE);
  const out: number[] = [];
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++)
      if (tx >= 0 && ty >= 0 && tx < g.cols && ty < g.rows) out.push(ty * g.cols + tx);
  return out;
}

/** Ice that thaws under Ask's feet holds until they step off it (the next rebuild takes it). */
function keepIceUnderfoot(rt: SimRt, was: CoverGrid, next: CoverGrid): void {
  for (const i of feetTiles(rt, was)) {
    const k = was.kind[i] ?? 0;
    if (k !== 0 && was.cleared[i] === 0 && kindIs(rt, k, (id) => rt.db.cover[id].walk === true)) {
      next.kind[i] = k;
      next.cleared[i] = 0;
    }
  }
}

/**
 * A flood never rises round Ask: if they stand (or arrive, at `pos`) in the ford, the whole stretch of
 * flood joined to their feet stays dry until the next rebuild, so they can always wade back out.
 */
export function holdFloodOff(rt: SimRt, g: CoverGrid, pos: Vec): void {
  const sinks = (i: number): boolean => {
    const k = g.kind[i] ?? 0;
    return k !== 0 && g.cleared[i] === 0 && kindIs(rt, k, (id) => rt.db.cover[id].sink === true);
  };
  const todo = feetTiles(rt, g, pos).filter(sinks);
  while (todo.length > 0) {
    const i = todo.pop() ?? 0;
    if (!sinks(i)) continue;
    g.kind[i] = 0;
    const x = i % g.cols;
    const y = (i - x) / g.cols;
    if (x > 0) todo.push(i - 1);
    if (x < g.cols - 1) todo.push(i + 1);
    if (y > 0) todo.push(i - g.cols);
    if (y < g.rows - 1) todo.push(i + g.cols);
  }
}

/** The sword (and the spin) mows standing cover it can cut; cut tiles are saved under the season epoch. */
export function cutCover(rt: SimRt): void {
  const box = heroSwordBox(rt.hero, rt.db.tuning, rt.state.inv.weapon);
  if (box === null) return;
  saveCut(
    rt,
    cutBox(rt.screen.cover, box, (k) => kindIs(rt, k, (id) => rt.db.cover[id].cut !== false)),
  );
}

/** The boomerang blows away the light cover it passes (leaf piles), not grass. */
export function blowCover(rt: SimRt, box: Box): void {
  saveCut(
    rt,
    cutBox(rt.screen.cover, box, (k) => kindIs(rt, k, (id) => rt.db.cover[id].blown === true)),
  );
}

/** A blast tears up the cover it reaches: whatever a blade cuts, and drifts (`CoverDef.blasts`). */
export function blastCover(rt: SimRt, box: Box): void {
  saveCut(
    rt,
    cutBox(rt.screen.cover, box, (k) =>
      kindIs(rt, k, (id) => rt.db.cover[id].cut !== false || rt.db.cover[id].blasts === true),
    ),
  );
}

/** The hammer's blow (M8b) breaks drifts and anything else only a blast tears up, nothing it would cut. */
export function hammerCover(rt: SimRt, box: Box): void {
  saveCut(
    rt,
    cutBox(rt.screen.cover, box, (k) => kindIs(rt, k, (id) => rt.db.cover[id].blasts === true)),
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

/**
 * Speed factor of the cover under a feet point (1 on bare ground). The winter cloak halves how much snow
 * and drifts slow the hero.
 */
export function coverSpeed(rt: SimRt, e: Entity, x: number, y: number): number {
  const id = coverAt(rt.screen.cover, rt.db.coverOrder, Math.floor(x / TILE), Math.floor((y - 1) / TILE));
  if (id === null) return 1;
  const def = rt.db.cover[id];
  if (e === rt.hero && def.cloak === true && (rt.state.inv.items.winter_cloak ?? 0) > 0)
    return 1 - (1 - def.slow) / 2;
  return def.slow;
}

/** Tile indices where standing cover passes `test` on its def. */
function standingTiles(rt: SimRt, test: (def: SimRt['db']['cover'][CoverId]) => boolean): number[] {
  const g = rt.screen.cover;
  const out: number[] = [];
  for (let i = 0; i < g.kind.length; i++) {
    const k = g.kind[i] ?? 0;
    if (k !== 0 && g.cleared[i] === 0 && kindIs(rt, k, (id) => test(rt.db.cover[id]))) out.push(i);
  }
  return out;
}

/** Tile indices where walkable cover (ice) stands. */
export function walkTiles(rt: SimRt): number[] {
  return standingTiles(rt, (d) => d.walk === true);
}

/** Tile indices where impassable cover (a flood) stands. */
export function sinkTiles(rt: SimRt): number[] {
  return standingTiles(rt, (d) => d.sink === true);
}
