import type { EnemyId } from '@content/ids';
import { mem, type Entity } from '../../actors/entity';
import type { EnemyDef } from '../../actors/enemies/defs';
import { changeState } from '../../actors/fsm';
import { swordOf } from '../../actors/tuning';
import { HERO_MACHINE, heroSwordBox, heroSwordDamage } from '../../actors/hero';
import { rollDrop } from '../../combat/drops';
import { resolveHit, type HitData, type HitResult } from '../../combat/hit';
import { EMPTY_FRAME } from '../../input/actions';
import { at, overlaps } from '../../math/box';
import { DIR_VEC } from '../../math/dir';
import { normalize, sub } from '../../math/vec';
import type { SimRt } from '../rt';
import { heroCtx } from './hero';
import { enemyDef } from './movement';
import { createDrop } from './pickups';

/**
 * Applies a hero-side hit to an actor: the one damage path for the sword, thrown props and projectiles.
 * An enemy whose health runs out dies (or refills, if immortal). Emits `hit` unless the hit was ignored.
 */
export function damageActor(rt: SimRt, target: Entity, hit: HitData): HitResult {
  const def = target.kind === 'enemy' ? enemyDef(rt, target) : undefined;
  const result = resolveHit(target, hit, {
    shielding: false,
    iframes: rt.db.tuning.enemyIframes,
    knockResist: def?.knockResist ?? 0,
  });
  if (result.outcome === 'ignored') return result;
  rt.emit({ t: 'hit', target: target.id, blocked: result.outcome === 'blocked', dealt: result.dealt });
  if (result.outcome === 'killed' && def !== undefined) {
    if (def.immortal) target.hp = target.maxHp;
    else killEnemy(rt, target, def);
  }
  return result;
}

/** Removes a dead enemy, announces it and rolls its drop. */
export function killEnemy(rt: SimRt, e: Entity, def: EnemyDef): void {
  rt.actors = rt.actors.filter((a) => a !== e);
  rt.emit({ t: 'killed', id: e.id, def: e.def as EnemyId, x: e.pos.x, y: e.pos.y });
  if (def.drops === undefined) return;
  const drop = rollDrop(rt.state.rng, def.drops);
  if (drop !== null) rt.actors.push(createDrop(rt.newId(), drop, e.pos));
}

/** Applies the hero's live sword box to every actor it touches, once per swing. */
export function resolveSword(rt: SimRt): void {
  const { hero, db } = rt;
  const box = heroSwordBox(hero, db.tuning, rt.state.inv.weapon);
  if (box === null) return;
  const swing = mem(hero, 'swing');
  const spinning = mem(hero, 'spinOn') === 1;
  for (const e of [...rt.actors]) {
    if (e.kind !== 'enemy') continue;
    if (mem(e, 'hitSwing') === swing || !overlaps(box, at(e.hurt, e.pos))) continue;
    e.mem['hitSwing'] = swing;
    const away = normalize(sub(e.pos, hero.pos));
    const dir = spinning && (away.x !== 0 || away.y !== 0) ? away : DIR_VEC[hero.facing];
    const result = damageActor(rt, e, {
      amount: heroSwordDamage(hero, db.tuning, rt.state.inv.weapon),
      element: 'none',
      knock: swordOf(db.tuning, rt.state.inv.weapon).knock,
      dir,
      faction: 'hero',
      tags: 0,
    });
    if (result.outcome === 'ignored') continue;
    rt.emit({ t: 'sfx', id: result.outcome === 'blocked' ? 'sfx_block' : 'sfx_hit' });
  }
}

/** Enemies with contact damage hurt the hero when their hurt boxes touch. */
export function resolveContact(rt: SimRt): void {
  const { hero, db } = rt;
  const heroBox = at(hero.hurt, hero.pos);
  for (const e of rt.actors) {
    if (e.kind !== 'enemy') continue;
    const touch = enemyDef(rt, e).touch;
    if (touch === undefined || !overlaps(heroBox, at(e.hurt, e.pos))) continue;
    const away = normalize(sub(hero.pos, e.pos));
    const dir = away.x === 0 && away.y === 0 ? DIR_VEC[hero.facing] : away;
    const result = resolveHit(
      hero,
      {
        amount: touch.amount,
        element: 'none',
        knock: touch.knock,
        dir,
        faction: e.faction,
        tags: touch.tags,
      },
      { shielding: mem(hero, 'shielding') === 1, iframes: db.tuning.hero.hurtIframes, knockResist: 0 },
    );
    if (result.outcome === 'ignored') continue;
    rt.emit({ t: 'hit', target: hero.id, blocked: result.outcome === 'blocked', dealt: result.dealt });
    rt.emit({ t: 'sfx', id: result.outcome === 'blocked' ? 'sfx_block' : 'sfx_hurt' });
    if (result.outcome !== 'blocked') changeState(HERO_MACHINE, hero, 'hurt', heroCtx(rt, EMPTY_FRAME));
    return;
  }
}
