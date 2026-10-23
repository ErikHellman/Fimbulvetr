import { describe, expect, it } from 'vitest';
import { TUNING } from '@content/tuning';
import { Harness } from './harness';

const { regenTicks, floor } = TUNING.seidr;

function low(n: number): Harness {
  const h = new Harness({ tile: [20, 10] });
  h.sim.state.hero.seidr = n;
  return h;
}

describe('seiðr regen', () => {
  it('ticks back one point every regenTicks while below the floor', () => {
    const h = low(0);
    h.idle(regenTicks - 1);
    expect(h.sim.state.hero.seidr).toBe(0);
    h.idle(1);
    expect(h.sim.state.hero.seidr).toBe(1);
    h.idle(regenTicks);
    expect(h.sim.state.hero.seidr).toBe(2);
  });

  it('stops at the floor', () => {
    const h = low(floor - 1);
    h.idle(regenTicks * 4);
    expect(h.sim.state.hero.seidr).toBe(floor);
  });

  it('never tops up a bar already at or above the floor', () => {
    const h = low(floor + 1);
    h.idle(regenTicks * 4);
    expect(h.sim.state.hero.seidr).toBe(floor + 1);
  });

  it('respects a bar smaller than the floor', () => {
    const h = low(0);
    h.sim.state.hero.maxSeidr = 2;
    h.idle(regenTicks * 4);
    expect(h.sim.state.hero.seidr).toBe(2);
  });

  it('leaves the hash alone while idle at or above the floor', () => {
    const a = low(floor);
    const b = low(floor);
    a.idle(regenTicks + 1);
    b.idle(regenTicks + 1);
    expect(a.sim.hash()).toBe(b.sim.hash());
    expect(a.sim.seidrTicks).toBeUndefined();
  });
});
