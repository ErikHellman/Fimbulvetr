import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { LINDORMR } from '@core/actors/enemies/lindormr';
import type { Entity } from '@core/actors/entity';
import type { ContentDb } from '@core/sim/db';
import { blast } from '@core/sim/systems/bombs';
import { damageActor } from '@core/sim/systems/combat';
import { giveItem } from '@core/story/effects';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

/** test_a as Lindormr's pond: an open room with the serpent in the middle, (20, 11). */
function pond(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const things: Thing[] = [{ k: 'enemy', id: 'lindormr', at: { x: 20, y: 11 } }];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

function fight(): Harness {
  const h = new Harness({ db: pond(), tile: [20, 19], facing: 'n' });
  giveItem(h.sim, 'bombs', 10);
  h.sim.command({ t: 'god', on: true });
  return h.idle(2);
}

const worm = (h: Harness): Entity => {
  const e = h.sim.enemies.find((a) => a.def === 'lindormr');
  if (e === undefined) throw new Error('no Lindormr');
  return e;
};
const mounds = (h: Harness) => h.sim.enemies.filter((a) => a.def === 'lind_mound');
const moundAt = (h: Harness, spot: number) => mounds(h).find((m) => m.mem['spot'] === spot);
const spits = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'projectile' && a.def === 'spit');
const hit = (h: Harness, amount: number) =>
  damageActor(h.sim, worm(h), {
    amount,
    element: 'none',
    knock: 0,
    dir: { x: 0, y: 1 },
    faction: 'hero',
    tags: 0,
  });

/** Blows up the mound it hides in and waits a tick for it to notice. */
function flush(h: Harness): void {
  const m = moundAt(h, worm(h).mem['in'] ?? 0);
  if (m === undefined) throw new Error('no mound');
  blast(h.sim, { ...m.pos });
  h.idle(1);
}

/** Ticks until `pred` holds. */
function ticksUntil(h: Harness, pred: () => boolean, max = 600): number {
  for (let t = 0; t < max; t++) {
    if (pred()) return t;
    h.idle(1);
  }
  throw new Error('never');
}

describe('Lindormr', () => {
  it('wakes hidden in the first of four mud mounds, which bubbles', () => {
    const h = fight();
    expect(mounds(h)).toHaveLength(4);
    expect(worm(h).fsm.s).toBe('hidden');
    expect(worm(h).pos).toEqual(moundAt(h, 0)?.pos);
    h.idle(1);
    expect(mounds(h).map((m) => m.anim)).toEqual(['bubble', 'idle', 'idle', 'idle']);
    expect(h.sim.boss()?.name.en).toBe('Lindormr');
    h.expectAnims();
  });

  it('rears up for 400 ms (the tell) before it spits', () => {
    const h = fight();
    ticksUntil(h, () => worm(h).fsm.s === 'rear');
    expect(ticksUntil(h, () => spits(h).length > 0)).toBe(LINDORMR.rearTell + 1);
    h.expectAnims();
  });

  it('shrugs off the blade and bombs on other mounds, while hidden', () => {
    const h = fight();
    const before = worm(h).hp;
    const other = moundAt(h, 3);
    if (other === undefined) throw new Error('no mound');
    blast(h.sim, { ...other.pos });
    h.idle(1);
    expect(moundAt(h, 3)).toBeUndefined();
    expect(h.sim.actors.some((a) => a.kind === 'pickup' && a.def === 'bombs')).toBe(true);
    expect(worm(h).fsm.s).toBe('hidden');
    hit(h, 4);
    expect(worm(h).hp).toBe(before);
  });

  it('is flushed out by a bomb on its mound, open to the blade for 150 ticks, then burrows', () => {
    const h = fight();
    flush(h);
    expect(worm(h).fsm.s).toBe('flushed');
    hit(h, 2);
    expect(worm(h).hp).toBe(22);
    const open = ticksUntil(h, () => worm(h).fsm.s !== 'flushed');
    expect(open).toBeGreaterThanOrEqual(LINDORMR.flushTicks - 2);
    expect(open).toBeLessThanOrEqual(LINDORMR.flushTicks + 1);
    expect(worm(h).fsm.s).toBe('burrow');
    ticksUntil(h, () => worm(h).fsm.s === 'hidden');
    expect(worm(h).mem['in']).not.toBe(0);
    h.expectAnims();
  });

  it('roars into its second phase at 16: it moves underground after spitting twice, with a decoy', () => {
    const h = fight();
    worm(h).hp = 17;
    flush(h);
    hit(h, 2);
    h.idle(1);
    expect(worm(h).fsm.s).toBe('roar');
    expect(worm(h).mem['phase']).toBe(1);
    ticksUntil(h, () => worm(h).fsm.s === 'rear');
    ticksUntil(h, () => worm(h).fsm.s === 'ripple');
    expect(h.count('sfx')).toBeGreaterThan(0);
    expect(h.events.filter((e) => e.t === 'sfx' && e.id === 'sfx_spit')).toHaveLength(2);
    const decoy = worm(h).mem['decoy'] ?? -1;
    expect(decoy).toBeGreaterThanOrEqual(0);
    expect(decoy).not.toBe(worm(h).mem['in']);
    ticksUntil(h, () => worm(h).fsm.s === 'hidden');
    h.idle(1);
    expect(moundAt(h, decoy)?.anim).toBe('bubble');
    h.expectAnims();
  });

  it('coils for 500 ms and charges in its last phase, and a wall dazes it', () => {
    const h = fight();
    worm(h).hp = 8;
    worm(h).mem['phase'] = 2;
    flush(h);
    ticksUntil(h, () => worm(h).fsm.s === 'coil');
    expect(ticksUntil(h, () => worm(h).fsm.s === 'charge')).toBe(LINDORMR.coilTicks);
    ticksUntil(h, () => worm(h).fsm.s !== 'charge', 100);
    expect(worm(h).fsm.s).toBe('dazed');
    expect(worm(h).mem['guard']).toBe(0);
    h.expectAnims();
  });

  it('grows a blown mound back after four seconds', () => {
    const h = fight();
    const m = moundAt(h, 2);
    if (m === undefined) throw new Error('no mound');
    blast(h.sim, { ...m.pos });
    h.idle(1);
    expect(moundAt(h, 2)).toBeUndefined();
    expect(ticksUntil(h, () => moundAt(h, 2) !== undefined)).toBeGreaterThanOrEqual(LINDORMR.regrowTicks - 2);
  });

  it('never grows a mound back under Ask', () => {
    const h = fight();
    const m = moundAt(h, 2);
    if (m === undefined) throw new Error('no mound');
    const spot = { ...m.pos };
    blast(h.sim, spot);
    h.idle(1);
    h.sim.hero.pos = { ...spot };
    h.idle(LINDORMR.regrowTicks + 20);
    expect(moundAt(h, 2)).toBeUndefined();
    h.sim.hero.pos = { x: spot.x, y: spot.y + 48 };
    h.idle(2);
    expect(moundAt(h, 2)?.pos).toEqual(spot);
  });

  it('takes its mounds with it when it dies', () => {
    const h = fight();
    flush(h);
    worm(h).hp = 1;
    hit(h, 2);
    h.idle(1);
    expect(h.sim.enemies).toHaveLength(0);
    expect(h.events).toContainEqual({ t: 'bossDead' });
  });

  it('needs bombs', () => {
    expect(DB.enemies.lindormr.needs).toEqual(['bombs']);
  });
});
