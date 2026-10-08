import { changeState } from '../../actors/fsm';
import { HERO_MACHINE } from '../../actors/hero';
import { HAMMER, HEAVY } from '../../combat/hit';
import { EMPTY_FRAME } from '../../input/actions';
import { at, overlaps, type Box } from '../../math/box';
import { DIR_VEC } from '../../math/dir';
import type { SimRt } from '../rt';
import { damageActor } from './combat';
import { hammerCover } from './cover';
import { openCracks } from './fixtures';
import { heroCtx } from './hero';

/** The hammer's blow lands in a square this wide, centred one tile ahead of Ask's feet. */
export const HAMMER_REACH = 20;

/** The hammer's item key (M8b): Ask raises the hammer; `stepHammer` lands the blow. */
export function swingHammer(rt: SimRt): boolean {
  if ((rt.state.inv.items.hammer ?? 0) < 1) return false;
  changeState(HERO_MACHINE, rt.hero, 'hammer', heroCtx(rt, EMPTY_FRAME));
  return true;
}

/** Where the blow lands: one tile ahead of Ask. */
export function hammerBox(rt: SimRt): Box {
  const d = DIR_VEC[rt.hero.facing];
  const half = HAMMER_REACH / 2;
  return {
    x: rt.hero.pos.x + d.x * 16 - half,
    y: rt.hero.pos.y - 6 + d.y * 16 - half,
    w: HAMMER_REACH,
    h: HAMMER_REACH,
  };
}

/**
 * The tick the hammer comes down: a heavy force blow on foes there (armour that cracks to force breaks),
 * weak floors and stakes give, and drifts break.
 */
export function stepHammer(rt: SimRt): void {
  const h = rt.hero;
  if (h.fsm.s !== 'hammer' || h.fsm.t !== rt.db.tuning.hero.hammerHit) return;
  const box = hammerBox(rt);
  const dir = DIR_VEC[h.facing];
  for (const a of [...rt.actors]) {
    if (a.kind !== 'enemy' || !rt.actors.includes(a) || !overlaps(box, at(a.hurt, a.pos))) continue;
    damageActor(rt, a, {
      amount: rt.db.tuning.hero.hammerDamage,
      element: 'force',
      knock: 4,
      dir,
      faction: 'hero',
      tags: HEAVY | HAMMER,
    });
  }
  openCracks(rt, box, 'hammer');
  hammerCover(rt, box);
  rt.emit({ t: 'shake', amount: 2 });
  rt.emit({ t: 'sfx', id: 'sfx_hammer' });
}
