import type { EnemyId } from '@content/ids';
import { mem } from '../../actors/entity';
import { PIERCE_SHIELD } from '../../combat/hit';
import { at } from '../../math/box';
import { hashInts } from '../../math/hash';
import { length, type Vec } from '../../math/vec';
import { encodeBits } from '../../world/cover';
import { TILE } from '../../world/dims';
import type { Light } from '../../world/light';
import type { SimRt } from '../rt';
import { damageActor, hurtHero } from './combat';
import { raining, windOf } from './weather';

const tileCentre = (i: number, cols: number): Vec => ({
  x: (i % cols) * TILE + TILE / 2,
  y: Math.floor(i / cols) * TILE + TILE / 2,
});

/** Sets a tile of standing cover alight if it burns (tall grass, leaves). Returns whether it caught. */
export function ignite(rt: SimRt, tx: number, ty: number): boolean {
  const g = rt.screen.cover;
  if (tx < 0 || ty < 0 || tx >= g.cols || ty >= g.rows) return false;
  const i = ty * g.cols + tx;
  const k = g.kind[i] ?? 0;
  const id = rt.db.coverOrder[k - 1];
  if (id === undefined || g.cleared[i] === 1 || (g.burn[i] ?? 0) > 0 || rt.db.cover[id].burns !== true)
    return false;
  g.burn[i] = rt.db.tuning.fire.burnTicks;
  g.burning += 1;
  return true;
}

/** Where fire can go from a tile: downwind in a wind, any side (by chance) in calm air. */
function spreadFrom(rt: SimRt, i: number, wind: Vec): number[] {
  const g = rt.screen.cover;
  const x = i % g.cols;
  const y = Math.floor(i / g.cols);
  const strength = length(wind);
  const to: [number, number][] = [];
  if (strength > 0.05) {
    const dx = Math.round(wind.x / strength);
    const dy = Math.round(wind.y / strength);
    to.push([x + dx, y + dy]);
    // A diagonal wind also carries it along both sides, so it runs through four-way grass.
    if (dx !== 0 && dy !== 0) to.push([x + dx, y], [x, y + dy]);
  } else {
    const around: [number, number][] = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    around.forEach(([nx, ny], n) => {
      if (hashInts(rt.state.seed, rt.state.playTicks, i, n) % 3 === 0) to.push([nx, ny]);
    });
  }
  return to
    .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < g.cols && ny < g.rows)
    .map(([nx, ny]) => ny * g.cols + nx);
}

/**
 * One tick of fire on the current screen: burning tiles count down, catch their neighbours halfway
 * (downwind; never in the rain), burn out into saved cleared tiles, and scorch whatever stands on them.
 * Nothing runs while nothing burns.
 */
export function stepFire(rt: SimRt): void {
  const g = rt.screen.cover;
  if (g.burning === 0) return;
  const f = rt.db.tuning.fire;
  const wind = windOf(rt);
  const wet = raining(rt);
  const catches: number[] = [];
  let out = false;
  for (let i = 0; i < g.burn.length; i++) {
    const t = g.burn[i] ?? 0;
    if (t === 0) continue;
    const left = t - 1;
    g.burn[i] = left;
    if (left === f.spreadAt && !wet) catches.push(...spreadFrom(rt, i, wind));
    if (left === 0) {
      g.burning -= 1;
      g.cleared[i] = 1;
      out = true;
    }
  }
  for (const i of catches) ignite(rt, i % g.cols, Math.floor(i / g.cols));
  if (out) {
    rt.state.world.cover[rt.screen.id] = { epoch: g.epoch, cleared: encodeBits(g.cleared) };
    rt.emit({ t: 'coverChanged', screen: rt.screen.id });
  }
  scorch(rt);
}

/** The feet of whatever stands in the flames: Ask (through the shield) and foes (every few ticks). */
function scorch(rt: SimRt): void {
  const g = rt.screen.cover;
  const f = rt.db.tuning.fire;
  const flames = (box: { x: number; y: number; w: number; h: number }): Vec | null => {
    const x0 = Math.max(0, Math.floor(box.x / TILE));
    const x1 = Math.min(g.cols - 1, Math.floor((box.x + box.w - 1e-6) / TILE));
    const y0 = Math.max(0, Math.floor(box.y / TILE));
    const y1 = Math.min(g.rows - 1, Math.floor((box.y + box.h - 1e-6) / TILE));
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++)
        if ((g.burn[ty * g.cols + tx] ?? 0) > 0) return tileCentre(ty * g.cols + tx, g.cols);
    return null;
  };
  const heroFire = flames(at(rt.hero.body, rt.hero.pos));
  if (heroFire !== null && hurtHero(rt, { pos: heroFire, faction: 'env' }, f.amount, f.knock, PIERCE_SHIELD))
    rt.emit({ t: 'sfx', id: 'sfx_fire' });
  for (const e of [...rt.actors]) {
    if (e.kind !== 'enemy') continue;
    if (mem(e, 'scorch') > 0) {
      e.mem['scorch'] = mem(e, 'scorch') - 1;
      continue;
    }
    const fire = flames(at(e.body, e.pos));
    if (fire === null || rt.db.enemies[e.def as EnemyId].immortal) continue;
    e.mem['scorch'] = f.scorch;
    const dx = e.pos.x - fire.x;
    const dy = e.pos.y - fire.y;
    const d = length({ x: dx, y: dy }) || 1;
    damageActor(rt, e, {
      amount: f.amount,
      element: 'fire',
      knock: f.knock,
      dir: { x: dx / d, y: dy / d },
      faction: 'env',
      tags: 0,
    });
  }
}

/** Burning tiles glow: at most a dozen lights, so a wide blaze stays cheap to draw. */
export function fireLights(rt: SimRt, r: number): Light[] {
  const g = rt.screen.cover;
  if (g.burning === 0) return [];
  const out: Light[] = [];
  const every = Math.max(1, Math.ceil(g.burning / 12));
  let n = 0;
  for (let i = 0; i < g.burn.length; i++) {
    if ((g.burn[i] ?? 0) === 0) continue;
    if (n++ % every === 0) out.push({ ...tileCentre(i, g.cols), r });
  }
  return out;
}

/** The burning tiles for the hash: absent while nothing burns. */
export function fireKey(rt: SimRt): string | undefined {
  const g = rt.screen.cover;
  if (g.burning === 0) return undefined;
  const parts: string[] = [];
  for (let i = 0; i < g.burn.length; i++)
    if ((g.burn[i] ?? 0) > 0) parts.push(`${String(i)}:${String(g.burn[i])}`);
  return parts.join(',');
}
