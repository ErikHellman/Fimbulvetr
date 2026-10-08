import { mem } from '../../actors/entity';
import type { SimRt } from '../rt';

/**
 * Ljós's light round Ask: how long it burns (20 s), the radius it carves out of the dark, and how far it
 * shows a hidden floor (wider than the lantern's 40 px).
 */
export const LJOS = { ticks: 1200, radius: 96, ghost: 88 } as const;

/** Sings Ljós: a light round Ask that burns the fog away and drags the mara into the open. */
export function castLjos(rt: SimRt): void {
  rt.hero.mem['ljosT'] = LJOS.ticks;
  rt.emit({ t: 'sfx', id: 'sfx_ljos' });
  stepLjos(rt);
}

/** Whether Ljós burns round Ask now. */
export const ljosBurns = (rt: SimRt): boolean => mem(rt.hero, 'ljosT') > 0;

/** While Ljós burns, every mara on the screen is lit (`mem.lit`) and cannot keep hidden. */
export function stepLjos(rt: SimRt): void {
  const lit = ljosBurns(rt) ? 1 : 0;
  for (const e of rt.actors)
    if (e.kind === 'enemy' && e.def === 'mara' && mem(e, 'lit') !== lit) e.mem['lit'] = lit;
}
