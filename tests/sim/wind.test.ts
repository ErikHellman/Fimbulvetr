import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { Harness } from './harness';

/** test_a as an open field. */
function field(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things: [] } } };
}

function thrower(weather: 'wind' | null): Harness {
  const h = new Harness({ db: field(), tile: [10, 10], facing: 'e' });
  h.sim.state.inv.items.boomerang = 1;
  h.sim.state.inv.slots = ['boomerang', null];
  if (weather !== null) h.sim.command({ t: 'weather', kind: weather });
  h.idle(1);
  return h;
}

const boomerang = (h: Harness) => h.sim.actors.find((a) => a.kind === 'projectile');

describe('wind', () => {
  it('blows the boomerang off its line on the way out', () => {
    const calm = thrower(null);
    const windy = thrower('wind');
    const w = windy.sim.wind();
    expect(Math.hypot(w.x, w.y)).toBeGreaterThan(0);
    expect(calm.sim.wind()).toEqual({ x: 0, y: 0 });
    calm.press(['item1']);
    windy.press(['item1']);
    for (let i = 0; i < 10; i++) {
      calm.idle(1);
      windy.idle(1);
    }
    const a = boomerang(calm);
    const b = boomerang(windy);
    if (a === undefined || b === undefined) throw new Error('no boomerang');
    expect(a.fsm.s).toBe('out');
    expect(b.pos.y - a.pos.y).toBeCloseTo(w.y * (b.fsm.t - 0), 1);
  });

  it('still brings the boomerang home', () => {
    const h = thrower('wind');
    h.press(['item1']);
    h.until((s) => !s.actors.some((a) => a.kind === 'projectile'), 200);
  });
});
