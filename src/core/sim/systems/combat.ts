import type { EnemyId } from '@content/ids';
import { mem, type Entity, type Faction } from '../../actors/entity';
import type { EnemyDef } from '../../actors/enemies/defs';
import { changeState } from '../../actors/fsm';
import { swordOf } from '../../actors/tuning';
import { HERO_MACHINE, heroSwordBox, heroSwordDamage } from '../../actors/hero';
import { rollDrop } from '../../combat/drops';
import {
  HEAVY,
  PIERCE,
  PIERCE_SHIELD,
  STUN,
  resolveHit,
  type HitData,
  type HitResult,
} from '../../combat/hit';
import { EMPTY_FRAME } from '../../input/actions';
import { at, overlaps } from '../../math/box';
import { DIR_VEC } from '../../math/dir';
import { dot, normalize, scale, sub, type Vec } from '../../math/vec';
import { dungeonOf } from '../../state/dungeons';
import type { SimRt } from '../rt';
import { heroCtx } from './hero';
import { enemyDef } from './movement';
import { spillDrop } from './pickups';
import { applyAll } from './story';

/**
 * Applies a hero-side hit to an actor: the one damage path for the sword, thrown props and projectiles.
 * An enemy whose health runs out dies (or refills, if immortal). Emits `hit` unless the hit was ignored.
 */
export function damageActor(rt: SimRt, target: Entity, hit: HitData): HitResult {
  const def = target.kind === 'enemy' ? enemyDef(rt, target) : undefined;
  const armoured = def?.guard === true && mem(target, 'cracked') !== 1;
  if (
    armoured &&
    def.cracks === hit.element &&
    target.faction !== hit.faction &&
    target.iframes === 0 &&
    mem(target, 'guard') !== 1
  ) {
    // The one element that breaks this armour (a bomb on a mud-crab's shell): it is open from now on.
    target.mem['cracked'] = 1;
    rt.emit({ t: 'sfx', id: 'sfx_break' });
  }
  const shielded =
    def?.shield === true &&
    mem(target, 'open') !== 1 &&
    (hit.tags & (PIERCE | HEAVY)) === 0 &&
    dot(hit.dir, DIR_VEC[target.facing]) < -0.3;
  const guarded = (armoured && mem(target, 'cracked') !== 1) || mem(target, 'guard') === 1 || shielded;
  if (guarded && target.faction !== hit.faction && target.iframes === 0) {
    // A guarded weak point (a closed core): the blow clinks off.
    target.knock = scale(hit.dir, (hit.knock / 2) * (1 - (def?.knockResist ?? 0)));
    rt.emit({ t: 'hit', target: target.id, blocked: true, dealt: 0 });
    return { outcome: 'blocked', dealt: 0 };
  }
  if (def?.stunnable !== undefined && (hit.tags & STUN) !== 0 && target.faction !== hit.faction) {
    // A behaviour may shorten its own stun (`mem.stunFor`), as Rótvættr's bulbs do in later phases.
    target.mem['stun'] = mem(target, 'stunFor') > 0 ? mem(target, 'stunFor') : def.stunnable;
    target.vel = { x: 0, y: 0 };
  }
  // A foe weak to the element (a draugr to fire) takes double.
  const weak = def?.weak?.includes(hit.element) === true && hit.amount > 0;
  const result = resolveHit(target, weak ? { ...hit, amount: hit.amount * 2 } : hit, {
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

/**
 * Removes a dead enemy, announces it and rolls its drop. A boss takes its summons with it and is marked
 * dead in its dungeon for good.
 */
export function killEnemy(rt: SimRt, e: Entity, def: EnemyDef): void {
  rt.actors = rt.actors.filter((a) => a !== e);
  rt.emit({ t: 'killed', id: e.id, def: e.def as EnemyId, x: e.pos.x, y: e.pos.y });
  rt.emit({ t: 'sfx', id: 'sfx_poof' });
  if (def.boss !== undefined) {
    for (const a of [...rt.actors])
      if (a.kind === 'enemy' && mem(a, 'summoned') === 1) killEnemy(rt, a, enemyDef(rt, a));
    const dungeon = rt.db.screens[rt.screen.id].dungeon;
    if (dungeon !== undefined) dungeonOf(rt.state, dungeon).bossDead = true;
    rt.emit({ t: 'shake', amount: 6 });
    rt.emit({ t: 'bossDead' });
  }
  if (mem(e, 'summoned') === 0 && e.mem['thing'] !== undefined) {
    const thing = rt.db.screens[rt.screen.id].things[mem(e, 'thing')];
    if (thing?.k === 'enemy' && thing.onDeath !== undefined) applyAll(rt, thing.onDeath);
  }
  if (def.drops === undefined) return;
  const drop = rollDrop(rt.state.rng, def.drops);
  if (drop !== null) spillDrop(rt, drop, e.pos);
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
      tags: mem(hero, 'thrustOn') === 1 ? PIERCE : 0,
    });
    if (result.outcome === 'ignored') continue;
    const boss = enemyDef(rt, e).boss !== undefined;
    rt.emit({ t: 'sfx', id: result.outcome === 'blocked' ? 'sfx_block' : boss ? 'sfx_boss_hit' : 'sfx_hit' });
  }
}

/** Enemies hurt the hero by touch (contact damage) and by the blows of their attack windows. */
export function resolveAttacks(rt: SimRt): void {
  const { hero } = rt;
  const heroBox = at(hero.hurt, hero.pos);
  for (const e of rt.actors) {
    if (e.kind !== 'enemy' || mem(e, 'stun') > 0) continue;
    const def = enemyDef(rt, e);
    const w = def.attacks?.[e.fsm.s];
    const blow =
      w !== undefined &&
      e.fsm.t >= w.from &&
      e.fsm.t <= w.to &&
      overlaps(heroBox, at(w.boxes[e.facing], e.pos))
        ? w
        : undefined;
    const touch = def.touch !== undefined && overlaps(heroBox, at(e.hurt, e.pos)) ? def.touch : undefined;
    const hit = blow ?? touch;
    // Runestone scaling (see spawn.ts `scaleFoe`): a harder blow once enough stones burn.
    const extra = e.mem['tier'] === undefined ? 0 : (rt.db.tuning.stones.blow[mem(e, 'tier')] ?? 0);
    if (hit !== undefined && hurtHero(rt, e, hit.amount + extra, hit.knock, hit.tags)) return;
  }
}

/**
 * Styrr's parry: a foe's own blow (not a shot, not fire) that meets a shield raised within the last
 * `parryTicks` is turned, heavy or not. The foe stands stunned and the rest of its swing is spent.
 */
function parried(rt: SimRt, source: HitSource, dir: Vec, tags: number): boolean {
  const { hero, db } = rt;
  if (rt.state.flags.t_parry !== true || !('kind' in source) || source.kind !== 'enemy') return false;
  if (hero.fsm.s !== 'shield' || hero.fsm.t >= db.tuning.hero.parryTicks || hero.iframes > 0) return false;
  if ((tags & PIERCE_SHIELD) !== 0 || dot(dir, DIR_VEC[hero.facing]) >= 0) return false;
  const def = enemyDef(rt, source);
  const stun = def.boss !== undefined ? db.tuning.hero.parryStun / 2 : db.tuning.hero.parryStun;
  source.mem['stun'] = Math.max(mem(source, 'stun'), stun);
  source.vel = { x: 0, y: 0 };
  const w = def.attacks?.[source.fsm.s];
  if (w !== undefined) source.fsm.t = Math.max(source.fsm.t, w.to + 1);
  rt.emit({ t: 'hit', target: hero.id, blocked: true, dealt: 0 });
  rt.emit({ t: 'sfx', id: 'sfx_parry' });
  rt.emit({ t: 'parry', x: hero.pos.x + DIR_VEC[hero.facing].x * 10, y: hero.pos.y - 14 });
  return true;
}

/** Whatever deals a hit: an enemy, a shot, a fixture. */
type HitSource = { readonly pos: Vec; readonly faction: Faction } | Entity;

/** One hit on the hero from `source`; returns whether it landed or was blocked (not ignored). */
export function hurtHero(rt: SimRt, source: HitSource, amount: number, knock: number, tags: number): boolean {
  const { hero, db } = rt;
  if (rt.god === true) return false;
  const away = normalize(sub(hero.pos, source.pos));
  const dir = away.x === 0 && away.y === 0 ? DIR_VEC[hero.facing] : away;
  if (parried(rt, source, dir, tags)) return true;
  // Armour takes its share off every blow, but a blow always lands at least a quarter heart.
  const reduce = db.tuning.armor[rt.state.inv.armor].reduce;
  const dealt = amount <= 0 ? amount : Math.max(1, amount - Math.round(amount * reduce));
  const result = resolveHit(
    hero,
    { amount: dealt, element: 'none', knock, dir, faction: source.faction, tags },
    { shielding: mem(hero, 'shielding') === 1, iframes: db.tuning.hero.hurtIframes, knockResist: 0 },
  );
  if (result.outcome === 'ignored') return false;
  rt.emit({ t: 'hit', target: hero.id, blocked: result.outcome === 'blocked', dealt: result.dealt });
  rt.emit({ t: 'sfx', id: result.outcome === 'blocked' ? 'sfx_block' : 'sfx_hurt' });
  if (result.outcome !== 'blocked' && hero.hp > 0)
    changeState(HERO_MACHINE, hero, 'hurt', heroCtx(rt, EMPTY_FRAME));
  return true;
}
