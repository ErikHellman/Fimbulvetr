import type { Entity } from '../../actors/entity';
import { at } from '../../math/box';
import { LOW, SOLID } from '../../world/collision';
import { TILE } from '../../world/dims';
import { levelPassage, riseFooting } from '../../world/water';
import type { SimRt } from '../rt';
import { killEnemy } from './combat';
import { stampCollision } from './fixtures';
import { enemyDef } from './movement';
import { isResting } from './props';

/** The current screen's water level (0 on screens without water). */
export function waterLevel(rt: SimRt): number {
  const flag = rt.db.screens[rt.screen.id].water;
  const v = flag === undefined ? 0 : rt.state.flags[flag];
  return typeof v === 'number' ? v : 0;
}

/** The level a screen is loaded at: undefined on screens without water (so nothing else changes). */
export function loadLevel(rt: SimRt, id: SimRt['screen']['id']): number | undefined {
  const flag = rt.db.screens[id].water;
  if (flag === undefined) return undefined;
  const v = rt.state.flags[flag];
  return typeof v === 'number' ? v : 0;
}

/** The footing of the current screen's rising tiles at the level it was stamped at (none without water). */
export function levelTiles(rt: SimRt): ReadonlyMap<number, boolean> {
  const level = rt.screen.level;
  return level === undefined ? new Map() : levelPassage(rt.screen.terrain, rt.db.terrain, level);
}

/** Tile indices under a body standing at its feet. */
function tilesUnder(rt: SimRt, e: Entity): number[] {
  const b = at(e.body, e.pos);
  const cols = rt.screen.collision.cols;
  const out: number[] = [];
  for (let ty = Math.floor(b.y / TILE); ty <= Math.floor((b.y + b.h - 1e-6) / TILE); ty++)
    for (let tx = Math.floor(b.x / TILE); tx <= Math.floor((b.x + b.w - 1e-6) / TILE); tx++)
      out.push(ty * cols + tx);
  return out;
}

/** Whether the footing under Ask is the same at `level` as it is now (a wheel may only turn if so). */
export function footingHolds(rt: SimRt, level: number): boolean {
  const now = rt.screen.level ?? 0;
  const cells = rt.screen.terrain.cells;
  return tilesUnder(rt, rt.hero).every((i) => {
    const cell = cells[i];
    const rise = cell === undefined ? undefined : rt.db.terrain[cell].rise;
    return rise === undefined || riseFooting(rise, now) === riseFooting(rise, level);
  });
}

/** Whether the tile at a body's feet is open water. */
function inWater(rt: SimRt, e: Entity): boolean {
  const c = rt.screen.collision;
  const i = Math.floor((e.pos.y - 1) / TILE) * c.cols + Math.floor(e.pos.x / TILE);
  const f = c.flags[i] ?? 0;
  return (f & (SOLID | LOW)) === (SOLID | LOW);
}

/**
 * Follows the water level flag: when it differs from the level the screen was stamped at, restamps the
 * collision, drowns walking foes left in the water, sinks resting props and pickups there, and tells the
 * shell to redraw. Returns at once on screens without water or when nothing changed. Runs in play and in
 * story mode.
 */
export function refreshWater(rt: SimRt): void {
  if (rt.screen.level === undefined) return;
  const level = waterLevel(rt);
  if (level === rt.screen.level) return;
  rt.screen = { ...rt.screen, level };
  stampCollision(rt);
  for (const e of [...rt.actors]) {
    if (!rt.actors.includes(e) || !inWater(rt, e)) continue;
    if (e.kind === 'enemy') {
      const def = enemyDef(rt, e);
      if (def.flies !== true && def.swims !== true && !def.immortal) killEnemy(rt, e, def);
    } else if ((e.kind === 'prop' && isResting(e)) || e.kind === 'pickup') {
      rt.actors = rt.actors.filter((a) => a !== e);
      rt.emit({ t: 'sfx', id: 'sfx_splash' });
    }
  }
  rt.emit({ t: 'coverChanged', screen: rt.screen.id });
  rt.emit({ t: 'sfx', id: 'sfx_water' });
}
