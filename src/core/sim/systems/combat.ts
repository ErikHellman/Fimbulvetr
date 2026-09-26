import { mem } from '../../actors/entity';
import { changeState } from '../../actors/fsm';
import { swordOf } from '../../actors/tuning';
import { HERO_MACHINE, heroSwordBox, heroSwordDamage } from '../../actors/hero';
import { resolveHit } from '../../combat/hit';
import { EMPTY_FRAME } from '../../input/actions';
import { at, overlaps } from '../../math/box';
import { DIR_VEC } from '../../math/dir';
import { normalize, sub } from '../../math/vec';
import type { SimRt } from '../rt';
import { heroCtx } from './hero';
import { enemyDef } from './movement';

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
    const def = enemyDef(rt, e);
    const away = normalize(sub(e.pos, hero.pos));
    const dir = spinning && (away.x !== 0 || away.y !== 0) ? away : DIR_VEC[hero.facing];
    const result = resolveHit(
      e,
      {
        amount: heroSwordDamage(hero, db.tuning, rt.state.inv.weapon),
        element: 'none',
        knock: swordOf(db.tuning, rt.state.inv.weapon).knock,
        dir,
        faction: 'hero',
        tags: 0,
      },
      { shielding: false, iframes: db.tuning.enemyIframes, knockResist: def.knockResist },
    );
    if (result.outcome === 'ignored') continue;
    rt.emit({ t: 'hit', target: e.id, blocked: result.outcome === 'blocked', dealt: result.dealt });
    rt.emit({ t: 'sfx', id: result.outcome === 'blocked' ? 'sfx_block' : 'sfx_hit' });
    if (result.outcome === 'killed') {
      if (def.immortal) e.hp = e.maxHp;
      else rt.actors = rt.actors.filter((x) => x !== e);
    }
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
    rt.emit({ t: 'sfx', id: result.outcome === 'blocked' ? 'sfx_block' : 'sfx_hit' });
    if (result.outcome !== 'blocked') changeState(HERO_MACHINE, hero, 'hurt', heroCtx(rt, EMPTY_FRAME));
    return;
  }
}
