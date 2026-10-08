import { mem } from '../../actors/entity';
import { HRIMNIR } from '../../actors/enemies/hrimnir';
import { HEAVY, PIERCE_SHIELD } from '../../combat/hit';
import type { SimRt } from '../rt';
import { hurtHero } from './combat';

/** The binding Embla holds open in Hrímnir's hall (M10b), in screen px: its centre and radius. */
export interface Ring {
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

/** The ring of binding on this screen (kept on the King, `mem.ringR`), or null when none burns. */
export function ringOf(rt: SimRt): Ring | null {
  for (const a of rt.actors)
    if (a.kind === 'enemy' && mem(a, 'ringR') > 0)
      return { x: mem(a, 'ringX'), y: mem(a, 'ringY'), r: mem(a, 'ringR') };
  return null;
}

/** Ticks outside the ring before the frost first bites. */
const BITE_AFTER = 90;

/**
 * The binding (M10b): the ring shrinks a little every tick. Outside it the King's frost bites whatever Ask
 * wears: the frost bar fills, and then `coldBurn` hp a second. When it has shrunk to nothing his breath
 * fills the hall (a heavy blow through the shield), and the binding opens wide again.
 */
export function stepBinding(rt: SimRt): void {
  const king = rt.actors.find((a) => a.kind === 'enemy' && mem(a, 'ringR') > 0);
  if (king === undefined) {
    rt.bindTicks = undefined;
    return;
  }
  const R = HRIMNIR.ring;
  const r = mem(king, 'ringR') - R.shrink;
  if (r <= R.rMin) {
    king.mem['ringR'] = R.rMax;
    rt.emit({ t: 'shake', amount: 8 });
    rt.emit({ t: 'sfx', id: 'sfx_frost' });
    hurtHero(rt, king, R.breath, 8, HEAVY | PIERCE_SHIELD);
    return;
  }
  king.mem['ringR'] = r;
  const dx = rt.hero.pos.x - mem(king, 'ringX');
  const dy = rt.hero.pos.y - mem(king, 'ringY');
  if (dx * dx + dy * dy <= r * r) {
    rt.bindTicks = undefined;
    return;
  }
  const h = rt.db.tuning.hero;
  const t = (rt.bindTicks ?? 0) + 1;
  rt.bindTicks = t;
  // The frost bar shows it coming (it drains again on its own once Ask is back inside).
  rt.coldTicks = Math.min(h.cold, Math.max(rt.coldTicks ?? 0, Math.round((t / BITE_AFTER) * h.cold)));
  if (t < BITE_AFTER || (t - BITE_AFTER) % 60 !== 0 || rt.god === true) return;
  rt.hero.hp = Math.max(0, rt.hero.hp - h.coldBurn);
  rt.emit({ t: 'hit', target: rt.hero.id, blocked: false, dealt: h.coldBurn });
  rt.emit({ t: 'sfx', id: 'sfx_hurt' });
}
