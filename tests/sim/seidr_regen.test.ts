import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { TUNING } from '@content/tuning';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

const { regenTicks, floor } = TUNING.seidr;

/** test_a walled in, with the given things far from Ask. */
function room(things: Thing[]): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

function low(n: number, things?: Thing[]): Harness {
  const h = new Harness({ tile: [20, 10], ...(things === undefined ? {} : { db: room(things) }) });
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

  it('pauses while a foe is about on the screen', () => {
    const h = low(0, [{ k: 'enemy', id: 'draugr', at: { x: 34, y: 18 } }]);
    h.sim.god = true;
    h.idle(regenTicks * 3);
    expect(h.sim.actors.some((a) => a.kind === 'enemy')).toBe(true);
    expect(h.sim.state.hero.seidr).toBe(0);
  });

  it('runs again once the screen is clear', () => {
    const h = low(0, [{ k: 'enemy', id: 'draugr', at: { x: 34, y: 18 } }]);
    h.idle(regenTicks);
    h.sim.actors = h.sim.actors.filter((a) => a.kind !== 'enemy');
    h.idle(regenTicks);
    expect(h.sim.state.hero.seidr).toBe(1);
  });

  it('ignores sleeping dead and the training dummy', () => {
    const h = low(0, [
      { k: 'enemy', id: 'draugr', at: { x: 34, y: 18 }, asleep: true },
      { k: 'enemy', id: 'dummy', at: { x: 4, y: 18 } },
    ]);
    h.idle(regenTicks);
    expect(h.sim.state.hero.seidr).toBe(1);
  });

  it('can be told to ignore foes', () => {
    const db = room([{ k: 'enemy', id: 'draugr', at: { x: 34, y: 18 } }]);
    const h = new Harness({
      tile: [20, 10],
      db: { ...db, tuning: { ...db.tuning, seidr: { ...db.tuning.seidr, pauseForFoes: false } } },
    });
    h.sim.state.hero.seidr = 0;
    h.sim.god = true;
    h.idle(regenTicks);
    expect(h.sim.state.hero.seidr).toBe(1);
  });
});
