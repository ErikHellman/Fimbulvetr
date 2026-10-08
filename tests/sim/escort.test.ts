import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { createEnemy } from '@core/actors/enemies';
import { mem } from '@core/actors/entity';
import { length, sub } from '@core/math/vec';
import { evalCond } from '@core/story/cond';
import { applyEffect } from '@core/story/effects';
import { condCtx } from '@core/sim/systems/story';
import { follower } from '@core/sim/systems/escort';
import type { ContentDb } from '@core/sim/db';
import { Harness } from './harness';

/** test_a as an open field with its east edge open, and no dummy. */
function field(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + (y >= 8 && y <= 13 ? '.' : '#'),
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things: [] } } };
}

function escorting(tile: [number, number], hp = 12): Harness {
  const h = new Harness({ db: field(), tile });
  applyEffect({ k: 'escort', npc: 'hekla', hp, lost: 'escort_lost' }, h.sim);
  return h;
}

describe('an escorted NPC', () => {
  it('stands beside Ask, shows her health, and counts as escorted', () => {
    const h = escorting([10, 10]);
    expect(follower(h.sim)).toBeDefined();
    expect(h.sim.escortHp()).toEqual({ hp: 12, max: 12 });
    expect(evalCond({ k: 'escort', npc: 'hekla' }, condCtx(h.sim))).toBe(true);
    expect(evalCond({ k: 'escort', npc: 'dvalinn' }, condCtx(h.sim))).toBe(false);
  });

  it('walks Ask’s trail a little behind her', () => {
    const h = escorting([6, 10]);
    h.hold(['right'], 120);
    const her = follower(h.sim);
    expect(her).toBeDefined();
    if (her === undefined) return;
    const gap = length(sub(h.sim.hero.pos, her.pos));
    expect(her.pos.x).toBeGreaterThan(6 * 16 + 40);
    expect(gap).toBeGreaterThan(10);
    expect(gap).toBeLessThan(48);
  });

  it('stops while a foe is near her', () => {
    const h = escorting([6, 10]);
    const her = follower(h.sim);
    if (her === undefined) throw new Error('no follower');
    const foe = createEnemy(h.sim.newId(), DB.enemies.dummy, { x: her.pos.x, y: her.pos.y + 30 });
    h.sim.actors.push(foe);
    const x = her.pos.x;
    h.hold(['right'], 60);
    expect(her.pos.x).toBe(x);
  });

  it('waits when Ask runs far ahead', () => {
    const h = escorting([4, 3]);
    const her = follower(h.sim);
    if (her === undefined) throw new Error('no follower');
    her.pos = { x: her.pos.x, y: her.pos.y + 16 * 12 };
    const at = { ...her.pos };
    h.hold(['right'], 40);
    expect(her.pos).toEqual(at);
  });

  it('comes with Ask over a screen edge', () => {
    const h = escorting([36, 10]);
    h.until((s) => s.state.hero.screen !== 'test_a', 200, h.frame(['right']));
    expect(h.sim.state.hero.screen).toBe('test_b');
    h.idle(30);
    const her = follower(h.sim);
    expect(her).toBeDefined();
    expect(length(sub(h.sim.hero.pos, her?.pos ?? { x: 0, y: 0 }))).toBeLessThan(40);
  });

  it('is hurt by foes, and at 0 the escort ends and its lost script runs', () => {
    const h = escorting([10, 10], 1);
    const her = follower(h.sim);
    if (her === undefined) throw new Error('no follower');
    h.sim.actors.push(createEnemy(h.sim.newId(), DB.enemies.vargr, { ...her.pos }));
    h.idle(3);
    expect(h.sim.escortHp()).toBeNull();
    expect(follower(h.sim)).toBeUndefined();
    expect(h.sim.actors.some((a) => a.kind === 'npc' && mem(a, 'escort') === 1)).toBe(false);
    // Her lost script tells Ask she ran back to the camp.
    h.idle(60);
    const ui = h.sim.storyUi();
    expect(ui?.k).toBe('text');
  });
});
