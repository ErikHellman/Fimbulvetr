import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { BEHAVIOURS, createEnemy } from '@core/actors/enemies';
import { MYRLJOS } from '@core/actors/enemies/wisp';
import { VATNORMR } from '@core/actors/enemies/worm';
import { runFsm } from '@core/actors/fsm';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { testCtx } from '../unit/core/actorCtx';
import { Harness } from './harness';

/**
 * test_a opened up round a pool (rows 6–10, cols 12–22) with a water-worm at (17, 10) on its south edge;
 * `rows` are extra map text laid over rows, `things` more things.
 */
function pool(rows: Record<number, string> = {}, things: Thing[] = []): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    if (rows[y] !== undefined) return rows[y];
    if (y >= 6 && y <= 10) return '#' + '.'.repeat(11) + '~'.repeat(11) + '.'.repeat(16) + '#';
    return '#' + '.'.repeat(38) + '#';
  });
  const worm: Thing = { k: 'enemy', id: 'vatnormr', at: { x: 17, y: 10 } };
  const screen = { ...DB.screens.test_a, map, things: [worm, ...things] };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

const wormOf = (h: Harness) => h.sim.enemies.find((e) => e.def === 'vatnormr');
const spits = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'projectile' && a.def === 'spit');

describe('the water-worm', () => {
  it('lies out of reach under the water until Ask comes near', () => {
    const h = new Harness({ db: pool(), tile: [17, 19], facing: 'n' });
    h.idle(60);
    expect(wormOf(h)?.fsm.s).toBe('under');
    expect(wormOf(h)?.iframes).toBeGreaterThan(0);
  });

  it('rears up for 400 ms (the tell) before it spits', () => {
    const e = createEnemy(1, DB.enemies.vatnormr, { x: 100, y: 100 });
    const ctx = testCtx({ hero: { x: 100, y: 150 } });
    let tellAt: number | null = null;
    let spatAt: number | null = null;
    for (let tick = 0; tick < 200 && spatAt === null; tick++) {
      runFsm(BEHAVIOURS.vatnormr, e, ctx);
      if (e.anim === 'tell' && tellAt === null) tellAt = tick;
      if (ctx.shots.length > 0) spatAt = tick;
    }
    const ticks = (spatAt ?? 0) - (tellAt ?? 0);
    expect(ticks).toBeGreaterThanOrEqual(18);
    expect(ticks).toBeLessThanOrEqual(30);
    expect(ctx.shots).toHaveLength(1);
    expect(ctx.shots[0]?.dir.y).toBeGreaterThan(0.9);
  });

  it('spits a gob over the water that hurts Ask', () => {
    const h = new Harness({ db: pool(), tile: [17, 13], facing: 'w' });
    const hp = h.sim.hero.hp;
    h.until(() => spits(h).length > 0, 200);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_spit' });
    h.idle(30);
    expect(h.sim.hero.hp).toBe(hp - 2);
    expect(spits(h)).toHaveLength(0);
  });

  it('is stopped by the shield held toward it', () => {
    const h = new Harness({ db: pool(), tile: [17, 13], facing: 'n' });
    const hp = h.sim.hero.hp;
    h.hold(['shield'], 120);
    expect(h.sim.hero.hp).toBe(hp);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_block' });
  });

  it('spits over water but not through a wall', () => {
    const wall = '#' + '.'.repeat(11) + '#'.repeat(11) + '.'.repeat(16) + '#';
    const h = new Harness({ db: pool({ 12: wall }), tile: [17, 14], facing: 'w' });
    const hp = h.sim.hero.hp;
    h.until(() => spits(h).length > 0, 200);
    h.idle(40);
    expect(spits(h)).toHaveLength(0);
    expect(h.sim.hero.hp).toBe(hp);
  });

  it('can be struck from the bank while it is up, and dies', () => {
    const h = new Harness({ db: pool(), tile: [17, 11], facing: 'n' });
    h.sim.hero.hp = 99;
    h.sim.hero.maxHp = 99;
    h.until(() => wormOf(h)?.fsm.s === 'up', 200);
    for (let i = 0; i < 3 && wormOf(h) !== undefined; i++) h.press(['sword']).idle(14);
    expect(wormOf(h)).toBeUndefined();
  });

  it('stays up while the boomerang holds it stunned', () => {
    const h = new Harness({ db: pool(), tile: [17, 14], facing: 'n' });
    h.sim.state.inv.items.boomerang = 1;
    h.sim.state.inv.slots = ['boomerang', null];
    h.until(() => wormOf(h)?.fsm.s === 'up', 200);
    h.press(['item1']);
    h.until(() => (wormOf(h)?.mem['stun'] ?? 0) > 0, 30);
    h.idle(VATNORMR.upTicks + 20);
    expect(wormOf(h)?.fsm.s).toBe('up');
  });

  it('never leaves its pool', () => {
    const h = new Harness({ db: pool(), tile: [17, 14], facing: 'n' });
    const at = { ...wormOf(h)?.pos };
    h.hold(['shield'], 400);
    expect(wormOf(h)?.pos).toEqual(at);
  });
});

describe('the bog-light', () => {
  const field = (): ContentDb => {
    const map = Array.from({ length: 22 }, (_, y) =>
      y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
    );
    const wisp: Thing = { k: 'enemy', id: 'myrljos', at: { x: 20, y: 6 } };
    return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things: [wisp] } } };
  };
  const wisp = (h: Harness) => h.sim.enemies.find((e) => e.def === 'myrljos');

  it('drifts toward Ask, flares (the tell) and darts', () => {
    const h = new Harness({ db: field(), tile: [20, 12], facing: 'n', minute: 23 * 60 });
    h.until(() => wisp(h)?.fsm.s === 'flare', 400);
    expect(wisp(h)?.anim).toBe('tell');
    h.idle(MYRLJOS.flareTicks + 1);
    expect(wisp(h)?.fsm.s).toBe('dart');
  });

  it('fades out of reach now and then', () => {
    const e = createEnemy(1, DB.enemies.myrljos, { x: 100, y: 100 });
    const ctx = testCtx({ hero: { x: 400, y: 400 } });
    for (let i = 0; i <= MYRLJOS.fadeEvery; i++) runFsm(BEHAVIOURS.myrljos, e, ctx);
    expect(e.fsm.s).toBe('fade');
    runFsm(BEHAVIOURS.myrljos, e, ctx);
    expect(e.iframes).toBeGreaterThan(0);
  });

  it('lights the dark around it', () => {
    const h = new Harness({ db: field(), tile: [4, 18], facing: 'n', minute: 23 * 60 });
    const w = wisp(h);
    const light = h.sim.lights().find((l) => l.r === DB.enemies.myrljos.glow);
    expect(light).toBeDefined();
    expect(light?.x).toBe(w?.pos.x);
  });

  it('goes out after two blows', () => {
    const h = new Harness({ db: field(), tile: [20, 8], facing: 'n', minute: 23 * 60 });
    h.sim.hero.hp = 99;
    h.sim.hero.maxHp = 99;
    for (let i = 0; i < 20 && wisp(h) !== undefined; i++) h.press(['sword']).idle(14);
    expect(wisp(h)).toBeUndefined();
  });
});
