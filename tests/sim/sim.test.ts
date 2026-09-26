import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { TUNING } from '@content/tuning';
import { at } from '@core/math/box';
import type { SimEvent } from '@core/sim/events';
import { SCREEN_W } from '@core/world/dims';
import { Harness, frameOf } from './harness';

const hits = (events: SimEvent[]): number[] => events.flatMap((e) => (e.t === 'hit' ? [e.dealt] : []));

describe('Sim', () => {
  it('walks the hero along the path', () => {
    const h = new Harness({ tile: [13, 11] });
    const x0 = h.sim.hero.pos.x;
    h.hold(['right'], 60);
    expect(h.sim.hero.pos.x).toBeCloseTo(x0 + TUNING.hero.walkSpeed * 60);
  });

  it('stops at the rock border', () => {
    const h = new Harness({ tile: [2, 19] });
    h.hold(['left'], 60);
    const body = at(h.sim.hero.body, h.sim.hero.pos);
    expect(body.x).toBe(16);
  });

  it('slides to the neighbouring screen', () => {
    const h = new Harness({ screen: 'test_a', tile: [37, 11] });
    h.until((s) => s.mode === 'transition', 120, frameOf(['right']));
    expect(h.sim.transition?.to).toBe('test_b');
    expect(h.count('screenTransition')).toBe(1);
    h.until((s) => s.mode === 'play', 60);
    expect(h.sim.screen.id).toBe('test_b');
    expect(h.sim.hero.pos.x).toBe(10);
    expect(h.count('screenEntered')).toBe(1);
    expect(h.sim.state.world.visited).toContain('test_b');
    expect(h.sim.state.hero.screen).toBe('test_b');
  });

  it('crosses north-south seams too', () => {
    const h = new Harness({ screen: 'test_b', tile: [19, 19] });
    h.until((s) => s.screen.id === 'test_c' && s.mode === 'play', 200, frameOf(['down']));
    h.until((s) => s.screen.id === 'test_b' && s.mode === 'play', 200, frameOf(['up']));
    expect(h.count('screenEntered')).toBe(2);
  });

  it('treats a screen edge without a neighbour as a wall', () => {
    const open = Array.from({ length: 22 }, () => '.'.repeat(40));
    const db = {
      ...DB,
      screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map: open, things: [] } },
      layout: { cols: 16, rows: 12, at: { test_a: [0, 0] as const } },
    };
    const h = new Harness({ db, tile: [38, 11] });
    h.hold(['right'], 60);
    expect(h.sim.mode).toBe('play');
    expect(at(h.sim.hero.body, h.sim.hero.pos).x + TUNING.hero.body.w).toBe(SCREEN_W);
  });

  it('hits the training dummy once per swing', () => {
    const h = new Harness({ tile: [23, 9], facing: 'e' });
    h.press(['sword']).idle(20);
    expect(hits(h.events)).toEqual([2]);
    expect(h.sim.enemies[0]?.hp).toBe(DB.enemies.dummy.hp - 2);
  });

  it('lands all three hits of a combo', () => {
    const h = new Harness({ tile: [23, 9], facing: 'e' });
    h.press(['sword']).idle(5).press(['sword']).idle(5).press(['sword']).idle(30);
    expect(hits(h.events)).toEqual([2, 2, 4]);
  });

  it('cannot walk through the solid dummy', () => {
    const h = new Harness({ tile: [21, 9] });
    h.hold(['right'], 60);
    const body = at(h.sim.hero.body, h.sim.hero.pos);
    const dummyFeetX = 24 * 16 + 8;
    expect(body.x + body.w).toBe(dummyFeetX + DB.enemies.dummy.body.x);
  });

  it('advances the clock one minute per 60 ticks of play', () => {
    const h = new Harness();
    const m0 = h.sim.state.clock.minute;
    h.idle(60);
    expect(h.sim.state.clock.minute).toBe(m0 + 1);
  });

  it('warps on command', () => {
    const h = new Harness();
    h.sim.command({ t: 'warp', screen: 'test_c', x: 100, y: 100 });
    h.idle(1);
    expect(h.sim.screen.id).toBe('test_c');
    expect(h.sim.hero.pos).toEqual({ x: 100, y: 100 });
    expect(h.count('screenEntered')).toBe(1);
  });

  it('sets the season and time on command', () => {
    const h = new Harness();
    h.sim.command({ t: 'setSeason', season: 'winter' });
    h.sim.command({ t: 'setMinute', minute: 22 * 60 });
    h.idle(1);
    expect(h.sim.state.clock.season).toBe('winter');
    expect(h.sim.state.clock.minute).toBe(22 * 60);
    expect(h.events).toContainEqual({ t: 'clock', e: { t: 'season', from: 'summer', to: 'winter' } });
  });

  it('keeps the saved hero in sync every tick', () => {
    const h = new Harness({ tile: [13, 11] });
    h.hold(['right'], 10);
    expect(h.sim.state.hero.x).toBe(h.sim.hero.pos.x);
    expect(h.sim.state.hero.facing).toBe('e');
    expect(h.sim.snapshot()).toEqual(h.sim.state);
  });
});
