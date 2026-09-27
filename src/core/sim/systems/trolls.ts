import type { EnemyId } from '@content/ids';
import { createProp } from '../../actors/prop';
import { isNight } from '../../clock/clock';
import type { SimRt } from '../rt';

/**
 * Sunrise turns every troll still out to stone where it stands: the enemy becomes its `petrify` prop (a
 * rock to lift and break for loot). Nothing is checked while no such enemy is on screen.
 */
export function petrifyAtDawn(rt: SimRt): void {
  const trolls = rt.actors.filter(
    (e) => e.kind === 'enemy' && rt.db.enemies[e.def as EnemyId].petrify !== undefined,
  );
  if (trolls.length === 0 || isNight(rt.state.clock, rt.db.clock)) return;
  for (const troll of trolls) {
    const prop = rt.db.enemies[troll.def as EnemyId].petrify;
    if (prop === undefined) continue;
    const stone = createProp(rt.newId(), rt.db.props[prop], troll.pos, -1);
    stone.facing = troll.facing;
    rt.actors = rt.actors.map((a) => (a === troll ? stone : a));
  }
  rt.emit({ t: 'sfx', id: 'sfx_stone' });
  rt.emit({ t: 'shake', amount: 3 });
}
