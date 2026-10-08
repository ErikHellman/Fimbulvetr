import { mem } from '../../actors/entity';
import type { SimRt } from '../rt';
import { openCracks } from './fixtures';
import { enemyDef } from './movement';

/** Skjálfti's quake (M8b): how long a foe staggers (2 s), and how hard the screen shakes. */
export const SKJALFTI = { stun: 120, shake: 6 } as const;

/**
 * Sings Skjálfti: the ground shakes. Every foe on the screen but a boss staggers; a boss gets `mem.quake`
 * for its own behaviour to read (Ívaldi on his anvil); every weak floor on the screen gives.
 */
export function castSkjalfti(rt: SimRt): void {
  for (const e of rt.actors) {
    if (e.kind !== 'enemy' || mem(e, 'asleep') === 1) continue;
    if (enemyDef(rt, e).boss !== undefined && enemyDef(rt, e).boss?.mini !== true) {
      e.mem['quake'] = 1;
      continue;
    }
    e.mem['stun'] = Math.max(mem(e, 'stun'), SKJALFTI.stun);
    e.vel = { x: 0, y: 0 };
  }
  openCracks(rt, { x: 0, y: 0, w: rt.screen.collision.cols * 16, h: rt.screen.collision.rows * 16 }, 'quake');
  rt.emit({ t: 'shake', amount: SKJALFTI.shake });
  rt.emit({ t: 'sfx', id: 'sfx_quake' });
}
