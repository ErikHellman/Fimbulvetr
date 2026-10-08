import { MARA } from '../../actors/enemies/mara';
import { PIERCE_SHIELD } from '../../combat/hit';
import type { SimRt } from '../rt';
import { hurtHero } from './combat';
import { enemyDef } from './movement';

/**
 * A mara riding Ask drains a point of seiðr every `MARA.drainEvery` ticks; with the bar empty it takes a
 * quarter heart instead. A roll throws it off (its behaviour sees that).
 */
export function stepRiders(rt: SimRt): void {
  for (const e of rt.actors) {
    if (e.kind !== 'enemy' || e.fsm.s !== 'ride' || enemyDef(rt, e).behaviour !== 'mara') continue;
    if (e.fsm.t === 0 || e.fsm.t % MARA.drainEvery !== 0) continue;
    if (rt.state.hero.seidr > 0) {
      rt.state.hero.seidr -= 1;
      rt.emit({ t: 'sfx', id: 'sfx_fizzle' });
    } else hurtHero(rt, e, 1, 0, PIERCE_SHIELD);
  }
}
