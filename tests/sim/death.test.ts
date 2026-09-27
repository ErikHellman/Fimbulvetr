import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { TEST_START } from '@content/start';
import { TUNING } from '@content/tuning';
import type { ContentDb } from '@core/sim/db';
import { Sim } from '@core/sim/sim';
import { CONTINUE_DELAY, CONTINUE_HP } from '@core/sim/systems/death';
import { newGame } from '@core/state/gameState';
import { Harness } from './harness';

/** The training dummy on test_a (24,9), made to bite hard on contact. */
function deadly(amount = 12): ContentDb {
  return {
    ...DB,
    enemies: { ...DB.enemies, dummy: { ...DB.enemies.dummy, touch: { amount, knock: 3, tags: 0 } } },
  };
}

/** Walks the hero into the dummy until the fall has run and the panel shows. */
function fall(h: Harness): Harness {
  h.until((s) => s.mode === 'over', 200, h.frame(['right']));
  return h.until(() => h.count('gameOver') === 1, TUNING.hero.dyingTicks + 5);
}

describe('death', () => {
  it('falls at 0 hp: dying, then over, with one gameOver after the fall', () => {
    const h = new Harness({ db: deadly(), tile: [21, 9], facing: 'e' });
    h.until((s) => s.mode === 'over', 200, h.frame(['right']));
    expect(h.sim.hero.hp).toBe(0);
    expect(h.sim.hero.fsm.s).toBe('dying');
    expect(h.sim.hero.anim).toBe('dying');
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_die' });
    expect(h.count('gameOver')).toBe(0);
    h.idle(TUNING.hero.dyingTicks);
    expect(h.count('gameOver')).toBe(1);
    h.idle(100);
    expect(h.count('gameOver')).toBe(1);
  });

  it('freezes the world clock and every actor while over', () => {
    const h = fall(new Harness({ db: deadly(), tile: [21, 9], facing: 'e' }));
    const clock = { ...h.sim.state.clock };
    const dummy = h.sim.enemies[0];
    const t = dummy?.fsm.t;
    h.idle(200);
    expect(h.sim.state.clock).toEqual(clock);
    expect(h.sim.enemies[0]?.fsm.t).toBe(t);
    expect(h.sim.mode).toBe('over');
  });

  it('ignores confirm until the panel has shown for a moment, then continues', () => {
    const h = fall(new Harness({ db: deadly(), tile: [21, 9], facing: 'e' }));
    h.press(['confirm']);
    expect(h.sim.mode).toBe('over');
    h.idle(CONTINUE_DELAY);
    h.press(['confirm']);
    expect(h.sim.mode).toBe('play');
    expect(h.sim.hero.hp).toBe(CONTINUE_HP);
    expect(h.sim.hero.fsm.s).toBe('move');
  });

  it('continues where the hero entered the screen, keeping flags, items and chests', () => {
    const h = new Harness({ db: deadly(), screen: 'test_b', tile: [5, 5], facing: 'e' });
    h.sim.command({ t: 'warp', screen: 'test_a', x: 18 * 16 + 8, y: 9 * 16 + 14 });
    h.idle(1);
    const entry = { ...h.sim.entry };
    expect(entry).toEqual({ x: 18 * 16 + 8, y: 9 * 16 + 14, facing: 'e' });
    h.sim.state.flags.q_sheep_d1 = true;
    h.sim.state.inv.items.flatbread = 2;
    h.sim.state.world.opened.push('chest_x');
    h.sim.state.dungeons.d1.keys = 1;
    fall(h);
    h.idle(CONTINUE_DELAY).press(['interact']);
    expect(h.sim.screen.id).toBe('test_a');
    expect(h.sim.hero.pos).toEqual({ x: entry.x, y: entry.y });
    expect(h.sim.hero.facing).toBe('e');
    expect(h.sim.state.flags.q_sheep_d1).toBe(true);
    expect(h.sim.state.inv.items.flatbread).toBe(2);
    expect(h.sim.state.world.opened).toContain('chest_x');
    expect(h.sim.state.dungeons.d1.keys).toBe(1);
    expect(h.sim.enemies).toHaveLength(1);
    expect(h.events.at(-1)).toEqual({ t: 'autosave' });
  });

  it('records the entry of a slide across an edge', () => {
    const h = new Harness({ screen: 'test_a', tile: [37, 11], facing: 'e' });
    h.until((s) => s.screen.id === 'test_b' && s.mode === 'play', 200, h.frame(['right']));
    expect(h.sim.entry.facing).toBe('e');
    expect(h.sim.entry.x).toBeLessThan(16);
  });

  it('continues with the maximum health when that is below three hearts', () => {
    const h = fall(new Harness({ db: deadly(), tile: [21, 9], facing: 'e' }));
    h.sim.hero.maxHp = 8;
    h.idle(CONTINUE_DELAY).press(['confirm']);
    expect(h.sim.hero.hp).toBe(8);
  });

  it('loads a save taken at 0 hp alive', () => {
    const state = newGame(1, TEST_START);
    state.hero.hp = 0;
    const sim = new Sim(DB, state);
    expect(sim.hero.hp).toBe(CONTINUE_HP);
    expect(sim.mode).toBe('play');
  });
});

describe('entry point', () => {
  it('is where the hero came through a door, facing the door arrival', () => {
    const h = new Harness({ screen: 'test_b', tile: [2, 11] });
    h.sim.command({ t: 'warp', screen: 'ask_farmyard', x: 150, y: 160 });
    h.idle(1);
    expect(h.sim.entry).toMatchObject({ x: 150, y: 160 });
  });

  it('is covered by the hash', () => {
    const a = new Harness();
    const b = new Harness();
    expect(a.sim.hash()).toBe(b.sim.hash());
    b.sim.entry = { ...b.sim.entry, x: b.sim.entry.x + 1 };
    expect(a.sim.hash()).not.toBe(b.sim.hash());
  });
});

describe('dev switches', () => {
  it('god mode keeps the hero from harm', () => {
    const h = new Harness({ db: deadly(), tile: [21, 9], facing: 'e' });
    h.sim.command({ t: 'god', on: true });
    h.hold(['right'], 120);
    expect(h.sim.hero.hp).toBe(12);
    expect(h.sim.mode).toBe('play');
  });

  it('killAll removes every mortal enemy', () => {
    const db = { ...DB, enemies: { ...DB.enemies, dummy: { ...DB.enemies.dummy, immortal: false } } };
    const h = new Harness({ db });
    h.sim.command({ t: 'killAll' });
    h.idle(1);
    expect(h.sim.enemies).toHaveLength(0);
    expect(h.count('killed')).toBe(1);
  });
});
