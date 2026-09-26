import { mem } from '../../actors/entity';
import { heroSwordBox, heroSwordDamage } from '../../actors/hero';
import { resolveHit } from '../../combat/hit';
import { at, overlaps } from '../../math/box';
import { DIR_VEC } from '../../math/dir';
import { normalize, sub } from '../../math/vec';
import type { SimRt } from '../rt';
import { enemyDef } from './movement';

/** Applies the hero's live sword box to every actor it touches, once per swing. */
export function resolveSword(rt: SimRt): void {
  const { hero, db } = rt;
  const box = heroSwordBox(hero, db.tuning);
  if (box === null) return;
  const swing = mem(hero, 'swing');
  const spinning = mem(hero, 'spinOn') === 1;
  for (const e of [...rt.actors]) {
    if (mem(e, 'hitSwing') === swing || !overlaps(box, at(e.hurt, e.pos))) continue;
    e.mem['hitSwing'] = swing;
    const def = enemyDef(rt, e);
    const away = normalize(sub(e.pos, hero.pos));
    const dir = spinning && (away.x !== 0 || away.y !== 0) ? away : DIR_VEC[hero.facing];
    const result = resolveHit(
      e,
      {
        amount: heroSwordDamage(hero, db.tuning),
        element: 'none',
        knock: db.tuning.sword.knock,
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
