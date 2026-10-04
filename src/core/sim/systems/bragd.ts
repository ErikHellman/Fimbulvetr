import { createEntity, setAnim, type Entity } from '../../actors/entity';
import { swordOf } from '../../actors/tuning';
import { PIERCE } from '../../combat/hit';
import { at, overlaps } from '../../math/box';
import { DIR_VEC } from '../../math/dir';
import { LOW, SOLID } from '../../world/collision';
import { TILE } from '../../world/dims';
import type { SimRt } from '../rt';
import { damageActor } from './combat';

/** Bragð's beam: px per tick, its reach in px (14 tiles), and its box around its ground point. */
export const BRAGD = { speed: 4, range: 14 * TILE, z: 10 } as const;
const BOX = { x: -6, y: -8, w: 12, h: 8 } as const;

/** Sings Bragð: a beam leaves the blade the way Ask faces (four ways). */
export function castBragd(rt: SimRt): void {
  const d = DIR_VEC[rt.hero.facing];
  const e = createEntity({
    id: rt.newId(),
    kind: 'projectile',
    def: 'bragd',
    art: 'fx_bragd',
    pos: { x: rt.hero.pos.x + d.x * 12, y: rt.hero.pos.y + d.y * 12 },
    facing: rt.hero.facing,
    body: BOX,
    hurt: BOX,
    faction: 'hero',
    hp: 1,
    maxHp: 1,
    state: 'fly',
  });
  setAnim(e, 'fly');
  e.mem['z'] = BRAGD.z;
  rt.actors.push(e);
  rt.emit({ t: 'sfx', id: 'sfx_bragd' });
}

/** Whether a point is in a tile that stops the beam: solid and not open above (it crosses water). */
function wallAt(rt: SimRt, x: number, y: number): boolean {
  const g = rt.screen.collision;
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  if (tx < 0 || ty < 0 || tx >= g.cols || ty >= g.rows) return true;
  const f = g.flags[ty * g.cols + tx] ?? 0;
  return (f & SOLID) !== 0 && (f & LOW) === 0;
}

/**
 * The beam flies straight on, unmoved by the wind, until its reach runs out or it meets a wall. The first
 * foe it touches takes the spin's damage, piercing a shield, and the beam is spent.
 */
export function stepBragd(rt: SimRt, e: Entity): void {
  const gone = (): void => {
    rt.actors = rt.actors.filter((x) => x !== e);
  };
  const d = DIR_VEC[e.facing];
  const next = { x: e.pos.x + d.x * BRAGD.speed, y: e.pos.y + d.y * BRAGD.speed };
  if ((e.fsm.t + 1) * BRAGD.speed > BRAGD.range || wallAt(rt, next.x, next.y - 3)) {
    gone();
    return;
  }
  e.pos = next;
  e.fsm.t += 1;
  const box = at(e.body, e.pos);
  const foe = rt.actors.find(
    (x) => x.kind === 'enemy' && overlaps(box, at(x.hurt, x.pos)) && x.iframes === 0,
  );
  if (foe === undefined) return;
  damageActor(rt, foe, {
    amount: swordOf(rt.db.tuning, rt.state.inv.weapon).spinDamage,
    element: 'none',
    knock: 4,
    dir: d,
    faction: 'hero',
    tags: PIERCE,
  });
  gone();
}
