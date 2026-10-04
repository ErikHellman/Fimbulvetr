import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { mem } from '@core/actors/entity';
import { RAFT } from '@core/sim/systems/raft';
import { Harness } from './harness';
import { heroTile, walkTo } from './walk';

/** Floor on cols 1–9 and 30–38, still water between, and a raft resting at (10, 9) that crosses to (28, 9). */
function river(extra: Thing[] = []): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    return '#' + '.'.repeat(9) + '~'.repeat(20) + '.'.repeat(9) + '#';
  });
  const raft: Thing = { k: 'raft', at: { x: 10, y: 9 }, path: [{ x: 28, y: 9 }] };
  const screen = { ...DB.screens.test_a, map, things: [raft, ...extra] };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

const raftOf = (h: Harness) => h.sim.actors.find((a) => a.kind === 'fixture' && a.def === 'raft');

describe('a raft', () => {
  it('rests at its stop as footing, then sets off and rests at the far stop', () => {
    const h = new Harness({ db: river(), tile: [9, 10], facing: 'e' });
    walkTo(h, 10, 10);
    expect(heroTile(h.sim)).toEqual([10, 10]);
    h.until(() => mem(raftOf(h) ?? h.sim.hero, 'moving') === 1, RAFT.wait + 10);
    h.until(() => mem(raftOf(h) ?? h.sim.hero, 'moving') === 0, 18 * 16 + 20);
    // Carried all the way.
    expect(heroTile(h.sim)).toEqual([28, 10]);
    walkTo(h, 31, 10);
    expect(heroTile(h.sim)).toEqual([31, 10]);
  });

  it('keeps Ask aboard while it moves: walking off into the water goes nowhere', () => {
    const h = new Harness({ db: river(), tile: [9, 10], facing: 'e' });
    walkTo(h, 10, 10);
    h.until(() => mem(raftOf(h) ?? h.sim.hero, 'moving') === 1, RAFT.wait + 10);
    const before = h.sim.hero.pos.y;
    h.hold(['down'], 30);
    expect(h.sim.hero.pos.y).toBe(before);
    expect(raftOf(h)?.pos.x ?? 0).toBeGreaterThan(10 * 16 + 16);
    expect(h.sim.hero.pos.x).toBeGreaterThan(10 * 16);
  });

  it('leaves Ask behind on the bank, and its stop is water again once it has gone', () => {
    const h = new Harness({ db: river(), tile: [9, 10], facing: 'e' });
    h.until(() => mem(raftOf(h) ?? h.sim.hero, 'moving') === 1, RAFT.wait + 10);
    h.idle(40);
    expect(heroTile(h.sim)).toEqual([9, 10]);
    h.hold(['right'], 30);
    expect(heroTile(h.sim)).toEqual([9, 10]);
  });

  it('comes back: it plies its path to and fro', () => {
    const h = new Harness({ db: river(), tile: [5, 10], facing: 'e' });
    const x0 = raftOf(h)?.pos.x ?? 0;
    h.until(() => mem(raftOf(h) ?? h.sim.hero, 'moving') === 1, RAFT.wait + 10);
    h.until(() => mem(raftOf(h) ?? h.sim.hero, 'moving') === 0, 18 * 16 + 20);
    h.until(() => mem(raftOf(h) ?? h.sim.hero, 'moving') === 1, RAFT.wait + 10);
    h.until(() => mem(raftOf(h) ?? h.sim.hero, 'moving') === 0, 18 * 16 + 20);
    expect(raftOf(h)?.pos.x).toBe(x0);
  });
});
