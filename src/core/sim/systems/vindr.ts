import { createEntity, mem, setAnim, type Entity } from '../../actors/entity';
import { at, overlaps } from '../../math/box';
import { DIR_VEC } from '../../math/dir';
import { LOW, SOLID } from '../../world/collision';
import { TILE } from '../../world/dims';
import type { SimRt } from '../rt';
import { blowCover } from './cover';
import { blowGate, spinFan } from './fixtures';
import { enemyDef, shove } from './movement';
import { fillSail } from './raft';

/**
 * Vindr's gust: how long it blows (ticks), how fast its front runs (px a tick: five tiles in its life), and
 * how far it shoves a foe (two tiles).
 */
export const VINDR = { ticks: 20, speed: 4, push: 2 * TILE } as const;

/** The gust's front: a tile-sized box around its ground point. */
const BOX = { x: -8, y: -14, w: 16, h: 16 } as const;

/** Sings Vindr: a gust leaves Ask the way Ask faces (four ways). */
export function castVindr(rt: SimRt): void {
  const d = DIR_VEC[rt.hero.facing];
  const e = createEntity({
    id: rt.newId(),
    kind: 'projectile',
    def: 'vindr',
    art: 'fx_vindr',
    pos: { x: rt.hero.pos.x + d.x * 8, y: rt.hero.pos.y + d.y * 8 },
    facing: rt.hero.facing,
    body: BOX,
    hurt: BOX,
    faction: 'hero',
    hp: 1,
    maxHp: 1,
    state: 'blow',
  });
  setAnim(e, 'blow');
  rt.actors.push(e);
  touch(rt, e);
  rt.emit({ t: 'sfx', id: 'sfx_gust' });
}

/** Whether a point is in a tile that stops the wind: solid and not open above (it crosses water and pits). */
function wallAt(rt: SimRt, x: number, y: number): boolean {
  const g = rt.screen.collision;
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  if (tx < 0 || ty < 0 || tx >= g.cols || ty >= g.rows) return true;
  const f = g.flags[ty * g.cols + tx] ?? 0;
  return (f & SOLID) !== 0 && (f & LOW) === 0;
}

/**
 * What the gust's front touches: a foe is shoved two tiles on (once per gust; a boss is not shoved but
 * marked with `mem.gust`, for its own behaviour to read and clear), leaf piles blow away, a wind fan spins,
 * and a resting raft's sail fills.
 */
function touch(rt: SimRt, e: Entity): void {
  const box = at(e.body, e.pos);
  const d = DIR_VEC[e.facing];
  for (const foe of rt.actors) {
    if (foe.kind !== 'enemy' || mem(foe, 'gustBy') === e.id) continue;
    if (!overlaps(box, at(foe.hurt, foe.pos))) continue;
    foe.mem['gustBy'] = e.id;
    if (enemyDef(rt, foe).boss !== undefined) foe.mem['gust'] = 1;
    else shove(rt, foe, d.x * VINDR.push, d.y * VINDR.push);
  }
  blowCover(rt, box);
  spinFan(rt, box);
  fillSail(rt, box);
}

/** The gust runs on until its breath is spent or it meets a wall or a web, touching what lies in its lane. */
export function stepVindr(rt: SimRt, e: Entity): void {
  const d = DIR_VEC[e.facing];
  const next = { x: e.pos.x + d.x * VINDR.speed, y: e.pos.y + d.y * VINDR.speed };
  // A web is stamped solid, so it is met before the wall it would otherwise be; the gust tears it away.
  const tore = blowGate(rt, at(e.body, next));
  if (tore || e.fsm.t + 1 >= VINDR.ticks || wallAt(rt, next.x, next.y - 6)) {
    rt.actors = rt.actors.filter((x) => x !== e);
    return;
  }
  e.pos = next;
  e.fsm.t += 1;
  touch(rt, e);
}
