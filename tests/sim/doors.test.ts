import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { TUNING } from '@content/tuning';
import { at } from '@core/math/box';
import { FADE_TICKS, entryPoint } from '@core/sim/sim';
import { SCREEN_H, SCREEN_W } from '@core/world/dims';
import { indexLayout, screenOrigin } from '@core/world/screen';
import { Harness, frameOf } from './harness';

describe('off-grid screens', () => {
  it('get distinct origins below the world grid', () => {
    const index = indexLayout(DB.layout, SCREEN_IDS);
    const o = screenOrigin(index, 'test_int');
    expect(o.y).toBeGreaterThanOrEqual(DB.layout.rows * SCREEN_H);
    const origins = SCREEN_IDS.map((id) => {
      const p = screenOrigin(index, id);
      return `${p.x},${p.y}`;
    });
    expect(new Set(origins).size).toBe(SCREEN_IDS.length);
  });

  it('can be warped to', () => {
    const h = new Harness({ screen: 'test_b', tile: [10, 11] });
    h.sim.command({ t: 'warp', screen: 'test_int', x: 19 * 16 + 8, y: 18 * 16 + 14 });
    h.idle(2);
    expect(h.sim.screen.id).toBe('test_int');
    expect(h.sim.originOf('test_int').y).toBeGreaterThan(0);
  });
});

describe('doors', () => {
  it('fade into the target screen, swapping at the midpoint', () => {
    const h = new Harness({ screen: 'test_b', tile: [26, 15], facing: 'n' });
    h.until((s) => s.mode === 'transition', 120, frameOf(['up']));
    const tr = h.sim.transition;
    expect(tr?.kind).toBe('fade');
    expect(tr?.to).toBe('test_int');
    expect(h.sim.screen.id).toBe('test_b');
    h.until((s) => s.transition !== null && s.transition.t >= FADE_TICKS / 2, 60);
    expect(h.sim.screen.id).toBe('test_int');
    expect(h.sim.fade()).toBeCloseTo(1);
    h.until((s) => s.mode === 'play', 60);
    expect(h.sim.fade()).toBe(0);
    expect(h.sim.hero.facing).toBe('n');
    expect(Math.floor(h.sim.hero.pos.x / 16)).toBe(19);
    expect(h.count('screenEntered')).toBe(1);
    expect(h.sim.state.world.visited).toContain('test_int');
  });

  it('lead back out', () => {
    const h = new Harness({ screen: 'test_int', tile: [19, 18], facing: 's' });
    h.until((s) => s.screen.id === 'test_b' && s.mode === 'play', 200, frameOf(['down']));
    expect(h.sim.hero.facing).toBe('s');
  });

  it('only open when walked into in their direction', () => {
    const h = new Harness({ screen: 'test_b', tile: [26, 15], facing: 'n' });
    h.hold(['left'], 5).hold(['right'], 5);
    expect(h.sim.mode).toBe('play');
  });
});

describe('transitions', () => {
  it('pause the clock during slides and fades', () => {
    const h = new Harness({ screen: 'test_b', tile: [26, 15], facing: 'n' });
    h.until((s) => s.mode === 'transition', 120, frameOf(['up']));
    const before = { ...h.sim.state.clock };
    h.until((s) => s.mode === 'play', 60);
    expect(h.sim.state.clock.minute).toBe(before.minute);
    expect(h.sim.state.clock.sub).toBe(before.sub);
  });

  it('clamp the arrival point into the screen on the other axis', () => {
    const body = TUNING.hero.body;
    const p = entryPoint('e', { x: SCREEN_W + 2, y: 2 }, body);
    expect(at(body, p).y).toBeGreaterThanOrEqual(0);
    const q = entryPoint('s', { x: SCREEN_W + 5, y: SCREEN_H + 2 }, body);
    expect(at(body, q).x + body.w).toBeLessThanOrEqual(SCREEN_W);
  });
});
