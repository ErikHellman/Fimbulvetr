import type { SimRt } from '../rt';

/** How much heat Ask can bear before burning: longer in the ember byrnie. */
export function heatMax(rt: SimRt): number {
  const h = rt.db.tuning.hero;
  return rt.state.inv.armor === 'ember_byrnie' ? h.heatEmber : h.heat;
}

/**
 * Heat (M8): in a `hot` screen it builds a tick at a time up to `heatMax`; once full, Ask burns
 * `heatBurn` hp a second, with no knockback and no armour against it. Elsewhere it drains four times as
 * fast. Kept on the runtime only (undefined at 0, so a cool game never changes the hash).
 */
export function stepHeat(rt: SimRt): void {
  const max = heatMax(rt);
  const now = rt.heatTicks ?? 0;
  if (rt.db.screens[rt.screen.id].hot !== true) {
    const left = Math.max(0, now - 4);
    rt.heatTicks = left > 0 ? left : undefined;
    rt.burnTicks = undefined;
    return;
  }
  const next = Math.min(max, now + 1);
  rt.heatTicks = next;
  if (next < max) {
    rt.burnTicks = undefined;
    return;
  }
  rt.burnTicks = (rt.burnTicks ?? 0) + 1;
  if (rt.burnTicks % 60 !== 1 || rt.god === true) return;
  rt.hero.hp = Math.max(0, rt.hero.hp - rt.db.tuning.hero.heatBurn);
  rt.emit({ t: 'hit', target: rt.hero.id, blocked: false, dealt: rt.db.tuning.hero.heatBurn });
  rt.emit({ t: 'sfx', id: 'sfx_hurt' });
}

/**
 * The killing frost (M9): in a `cold` screen it builds a tick at a time up to `Tuning.hero.cold`, unless
 * Ask wears the ember byrnie; once full, Ask loses `coldBurn` hp a second. Elsewhere, or in the byrnie, it
 * drains four times as fast. Kept on the runtime only (undefined at 0).
 */
export function stepCold(rt: SimRt): void {
  const h = rt.db.tuning.hero;
  const now = rt.coldTicks ?? 0;
  if (rt.db.screens[rt.screen.id].cold !== true || rt.db.tuning.armor[rt.state.inv.armor].warm === true) {
    if (now === 0) return;
    const left = Math.max(0, now - 4);
    rt.coldTicks = left > 0 ? left : undefined;
    rt.freezeTicks = undefined;
    return;
  }
  const next = Math.min(h.cold, now + 1);
  rt.coldTicks = next;
  if (next < h.cold) {
    rt.freezeTicks = undefined;
    return;
  }
  rt.freezeTicks = (rt.freezeTicks ?? 0) + 1;
  if (rt.freezeTicks % 60 !== 1 || rt.god === true) return;
  rt.hero.hp = Math.max(0, rt.hero.hp - h.coldBurn);
  rt.emit({ t: 'hit', target: rt.hero.id, blocked: false, dealt: h.coldBurn });
  rt.emit({ t: 'sfx', id: 'sfx_hurt' });
}
