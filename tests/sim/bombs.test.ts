import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { BEHAVIOURS, createEnemy } from '@core/actors/enemies';
import { LEIRKRABBI } from '@core/actors/enemies/crab';
import { runFsm } from '@core/actors/fsm';
import type { ContentDb } from '@core/sim/db';
import { BOMB, blast } from '@core/sim/systems/bombs';
import { equip } from '@core/sim/systems/items';
import { giveItem } from '@core/story/effects';
import { coverAt } from '@core/world/cover';
import { SOLID } from '@core/world/collision';
import { tileFeet, type Thing } from '@core/world/screen';
import { testCtx } from '../unit/core/actorCtx';
import { frameOf, Harness } from './harness';

/** test_a as an open yard (winter drifts on columns 26–30 with `drifts`), and the given things. */
function yard(things: Thing[] = [], drifts = false): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    return '#' + '.'.repeat(25) + (drifts ? '^' : '.').repeat(5) + '.'.repeat(8) + '#';
  });
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

/** Ask at (10, 10) facing east, ten bombs in the first slot. */
function bomber(db: ContentDb = yard(), season: 'summer' | 'winter' = 'summer'): Harness {
  const h = new Harness({ db, tile: [10, 10], facing: 'e', season });
  giveItem(h.sim, 'bombs', 10);
  equip(h.sim, 0, 'bombs');
  return h;
}

const FUSE = DB.props.bomb.fuse ?? 0;
const lit = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'prop' && a.def === 'bomb');
const bombs = (h: Harness) => h.sim.state.inv.items.bombs;
const blasts = (h: Harness) => h.events.filter((e) => e.t === 'blast');
/** A blast set off by hand, its events drained into the harness. */
function boom(h: Harness, x: number, y: number): void {
  blast(h.sim, tileFeet({ x, y }));
  h.events.push(...h.sim.drainEvents());
}
/** Walks west out of the blast. */
const flee = (h: Harness, ticks = 50) => h.hold(['left'], ticks);

describe('bombs', () => {
  it('set a lit bomb down just ahead of Ask, one from the bag', () => {
    const h = bomber();
    h.press(['item1']);
    expect(lit(h)).toHaveLength(1);
    expect(lit(h)[0]?.pos.x).toBeGreaterThan(h.sim.hero.pos.x);
    expect(lit(h)[0]?.anim).toBe('fuse');
    expect(bombs(h)).toBe(9);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_fuse' });
    h.expectAnims();
  });

  it('fizzle when the bag is empty', () => {
    const h = bomber();
    h.sim.state.inv.items.bombs = 0;
    h.press(['item1']);
    expect(lit(h)).toHaveLength(0);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_fizzle' });
  });

  it('burn for 96 ticks, blinking for the last 32, then go off', () => {
    const h = bomber();
    h.press(['item1']);
    let ticks = 1;
    const tick = (): boolean => {
      ticks += 1;
      return false;
    };
    flee(h, 40);
    ticks += 41;
    h.until(() => lit(h)[0]?.anim === 'blink' || tick(), 100);
    expect(ticks).toBeGreaterThanOrEqual(FUSE - BOMB.blinkAt - 2);
    h.expectAnims();
    h.until(() => blasts(h).length > 0 || tick(), 100);
    expect(ticks).toBeGreaterThanOrEqual(FUSE - 2);
    expect(ticks).toBeLessThanOrEqual(FUSE + 2);
    expect(lit(h)).toHaveLength(0);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_bomb' });
    expect(h.events).toContainEqual({ t: 'shake', amount: 3 });
    expect(h.sim.hero.hp).toBe(h.sim.hero.maxHp);
  });

  it('are at most two alight at once', () => {
    const h = bomber();
    h.press(['item1']).idle(20).press(['item1']).idle(20).press(['item1']);
    expect(lit(h)).toHaveLength(2);
    expect(bombs(h)).toBe(8);
  });

  it('can be lifted and thrown, and go off where they land', () => {
    const h = bomber();
    h.press(['item1']).idle(20);
    h.press(['interact']).idle(20);
    expect(h.sim.hero.fsm.s).toBe('carry');
    h.step(frameOf(['right'], ['interact'])).idle(30);
    const bomb = lit(h)[0];
    expect(bomb?.mem['thrown']).toBe(0);
    expect(bomb?.pos.x ?? 0).toBeGreaterThan(h.sim.hero.pos.x + 40);
    h.until(() => blasts(h).length > 0, 100);
    expect(h.sim.hero.hp).toBe(h.sim.hero.maxHp);
  });

  it('hurt Ask through the shield when one goes off in their hands', () => {
    const h = bomber();
    h.press(['item1']).idle(20).press(['interact']);
    h.until(() => blasts(h).length > 0, 120);
    expect(h.sim.hero.hp).toBe(h.sim.hero.maxHp - BOMB.toAsk);
    expect(h.sim.hero.mem['carrying']).toBe(0);
  });

  it('blast foes, pots and the next bomb, but not the pail, and strike switches', () => {
    const things: Thing[] = [
      { k: 'enemy', id: 'vargr', at: { x: 20, y: 10 } },
      { k: 'prop', id: 'pot', at: { x: 21, y: 10 } },
      { k: 'prop', id: 'pail', at: { x: 21, y: 11 } },
      { k: 'switch', at: { x: 20, y: 11 } },
    ];
    const h = bomber(yard(things));
    h.idle(1);
    h.press(['item1']);
    const other = lit(h)[0];
    if (other !== undefined) other.pos = { ...tileFeet({ x: 19, y: 10 }) };
    boom(h, 20, 10);
    expect(h.events).toContainEqual(expect.objectContaining({ t: 'killed', def: 'vargr' }));
    expect(h.sim.actors.some((a) => a.def === 'pot')).toBe(false);
    expect(h.sim.actors.some((a) => a.def === 'pail')).toBe(true);
    expect(h.sim.actors.find((a) => a.def === 'switch')?.mem['lit']).toBe(1);
    expect(other?.mem['fuse']).toBeLessThanOrEqual(2);
    h.idle(3);
    expect(blasts(h)).toHaveLength(2);
  });

  it('tear up drifts no blade can cut, and the cut is kept', () => {
    const h = bomber(yard([], true), 'winter');
    const cover = (x: number, y: number) => coverAt(h.sim.screen.cover, DB.coverOrder, x, y);
    expect(cover(27, 10)).toBe('drift');
    boom(h, 27, 10);
    expect(cover(27, 10)).toBeNull();
    expect(cover(27, 14)).toBe('drift');
    expect(h.sim.state.world.cover['test_a']).toBeDefined();
  });

  it('blow a cracked wall open for good', () => {
    const crack: Thing = { k: 'crack', id: 'test_crack', at: { x: 20, y: 9 }, w: 1, h: 3, art: 'wall' };
    const h = bomber(yard([crack]));
    const solid = (x: number, y: number) => ((h.sim.screen.collision.flags[y * 40 + x] ?? 0) & SOLID) !== 0;
    h.idle(1);
    expect(solid(20, 10)).toBe(true);
    // A blow does nothing to it.
    boom(h, 12, 10);
    expect(solid(20, 10)).toBe(true);
    boom(h, 19, 10);
    expect(h.sim.state.world.opened).toContain('test_crack');
    expect(solid(20, 9)).toBe(false);
    expect(solid(20, 11)).toBe(false);
    expect(h.sim.actors.filter((a) => a.def === 'crack').map((a) => a.anim)).toEqual([
      'open',
      'open',
      'open',
    ]);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_secret' });
    h.expectAnims();
  });

  it('leave cracks opened before open when Ask comes back', () => {
    const crack: Thing = { k: 'crack', id: 'test_crack', at: { x: 20, y: 9 }, w: 1, h: 3, art: 'rock' };
    const h = bomber(yard([crack]));
    h.idle(1);
    boom(h, 19, 10);
    h.sim.command({ t: 'warp', screen: 'test_a', x: 10, y: 10 });
    h.idle(40);
    expect(h.sim.actors.filter((a) => a.def === 'crack').map((a) => a.anim)).toEqual([
      'open',
      'open',
      'open',
    ]);
    expect((h.sim.screen.collision.flags[10 * 40 + 20] ?? 0) & SOLID).toBe(0);
  });
});

describe('the mud-crab', () => {
  const crabAt = (x: number, y: number): Thing => ({ k: 'enemy', id: 'leirkrabbi', at: { x, y } });
  const crabOf = (h: Harness) => h.sim.enemies.find((e) => e.def === 'leirkrabbi');

  it('raises its claws for 400 ms (the tell) before it pinches', () => {
    const e = createEnemy(1, DB.enemies.leirkrabbi, { x: 100, y: 100 });
    const ctx = testCtx({ hero: { x: 118, y: 100 } });
    let tellAt: number | null = null;
    let pinchAt: number | null = null;
    for (let tick = 0; tick < 100 && pinchAt === null; tick++) {
      runFsm(BEHAVIOURS.leirkrabbi, e, ctx);
      if (e.fsm.s === 'tell' && tellAt === null) tellAt = tick;
      if (e.fsm.s === 'pinch') pinchAt = tick;
    }
    expect((pinchAt ?? 0) - (tellAt ?? 0)).toBe(LEIRKRABBI.tellTicks);
  });

  it('sidles in toward Ask', () => {
    const e = createEnemy(1, DB.enemies.leirkrabbi, { x: 100, y: 100 });
    const ctx = testCtx({ hero: { x: 160, y: 120 } });
    for (let tick = 0; tick < 10; tick++) runFsm(BEHAVIOURS.leirkrabbi, e, ctx);
    expect(e.vel.x).toBeGreaterThan(0);
    expect(e.anim).toBe('walk');
  });

  it('turns the sword with its shell until a blast cracks it', () => {
    const h = bomber(yard([crabAt(30, 10)]));
    h.idle(1);
    const crab = crabOf(h);
    if (crab === undefined) throw new Error('no crab');
    /** Brings the crab to the tip of Ask's blade and swings. */
    const swing = (): void => {
      crab.pos = { x: h.sim.hero.pos.x + 22, y: h.sim.hero.pos.y };
      h.sim.hero.facing = 'e';
      h.press(['sword']).idle(8);
    };
    swing();
    expect(crab.hp).toBe(12);
    expect(h.events).toContainEqual(expect.objectContaining({ t: 'hit', target: crab.id, blocked: true }));
    blast(h.sim, { ...crab.pos });
    h.events.push(...h.sim.drainEvents());
    expect(crab.hp).toBe(12 - BOMB.toFoes);
    expect(crab.mem['cracked']).toBe(1);
    h.idle(40);
    swing();
    expect(crab.hp).toBeLessThan(12 - BOMB.toFoes);
  });

  it('needs bombs, and drops them once they are owned', () => {
    expect(DB.enemies.leirkrabbi.needs).toEqual(['bombs']);
    expect(DB.enemies.leirkrabbi.drops?.bombs).toBeGreaterThan(0);
  });
});
