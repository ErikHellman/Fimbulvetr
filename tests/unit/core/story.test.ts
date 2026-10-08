import { describe, expect, it } from 'vitest';
import { TEST_START } from '@content/start';
import { newGame } from '@core/state/gameState';
import { evalCond, phaseOf, questStage, type Cond, type CondCtx } from '@core/story/cond';
import { PURSE_CAP, applyEffect } from '@core/story/effects';
import { questLog, type QuestDef } from '@core/story/quests';
import { Harness } from '../../sim/harness';

const chores: QuestDef = {
  id: 'q_chores',
  name: { en: 'Chores', sv: 'Sysslor' },
  stages: [
    { when: { k: 'flag', id: 'st_farm_day', gte: 1 }, text: { en: 'Pen the sheep', sv: 'Fålla fåren' } },
    { when: { k: 'flag', id: 'q_sheep_d1' }, text: { en: 'Done', sv: 'Klart' } },
  ],
};

function ctx(): CondCtx {
  return { state: newGame(1, TEST_START), quests: { q_chores: chores } };
}

describe('evalCond', () => {
  it('reads flags as truthy, equal, at least or below', () => {
    const c = ctx();
    const check = (cond: Cond): boolean => evalCond(cond, c);
    expect(check({ k: 'flag', id: 'st_farm_day' })).toBe(false);
    expect(check({ k: 'flag', id: 'st_farm_day', eq: 0 })).toBe(true);
    expect(check({ k: 'flag', id: 'q_sheep_d1', eq: false })).toBe(true);
    c.state.flags.st_farm_day = 2;
    expect(check({ k: 'flag', id: 'st_farm_day' })).toBe(true);
    expect(check({ k: 'flag', id: 'st_farm_day', eq: 2 })).toBe(true);
    expect(check({ k: 'flag', id: 'st_farm_day', gte: 2, lt: 3 })).toBe(true);
    expect(check({ k: 'flag', id: 'st_farm_day', lt: 2 })).toBe(false);
  });

  it('counts heart pieces found and warp stones lit', () => {
    const c = ctx();
    expect(evalCond({ k: 'pieces', gte: 0 }, c)).toBe(true);
    expect(evalCond({ k: 'pieces', gte: 1 }, c)).toBe(false);
    c.state.world.pieces.push('hp_ask_village', 'hp_myl_fisher');
    expect(evalCond({ k: 'pieces', gte: 2 }, c)).toBe(true);
    expect(evalCond({ k: 'pieces', gte: 3 }, c)).toBe(false);
    expect(evalCond({ k: 'warps', gte: 1 }, c)).toBe(false);
    c.state.world.warps.push('askdalr');
    expect(evalCond({ k: 'warps', gte: 1 }, c)).toBe(true);
  });

  it('reads items, silver, season, weapon and the part of the day', () => {
    const c = ctx();
    c.state.inv.items.flatbread = 2;
    c.state.hero.silver = 30;
    c.state.clock.minute = 19 * 60;
    expect(evalCond({ k: 'item', id: 'flatbread', gte: 2 }, c)).toBe(true);
    expect(evalCond({ k: 'item', id: 'lantern' }, c)).toBe(false);
    expect(evalCond({ k: 'silver', gte: 31 }, c)).toBe(false);
    expect(evalCond({ k: 'season', is: 'summer' }, c)).toBe(true);
    expect(evalCond({ k: 'weapon', is: 'seax' }, c)).toBe(true);
    expect(evalCond({ k: 'phase', is: 'evening' }, c)).toBe(true);
    expect(evalCond({ k: 'phase', is: ['night', 'morning'] }, c)).toBe(false);
  });

  it('combines with all, any and not; a missing condition holds', () => {
    const c = ctx();
    const yes: Cond = { k: 'season', is: 'summer' };
    const no: Cond = { k: 'season', is: 'winter' };
    expect(evalCond({ k: 'all', of: [yes, no] }, c)).toBe(false);
    expect(evalCond({ k: 'any', of: [yes, no] }, c)).toBe(true);
    expect(evalCond({ k: 'not', c: no }, c)).toBe(true);
    expect(evalCond(undefined, c)).toBe(true);
  });

  it('splits the day into four parts', () => {
    expect([4, 5, 9, 10, 17, 18, 21, 22].map((h) => phaseOf(h * 60))).toEqual([
      'night',
      'morning',
      'morning',
      'day',
      'day',
      'evening',
      'evening',
      'night',
    ]);
  });
});

describe('quests', () => {
  it('derive their stage from flags', () => {
    const c = ctx();
    expect(questStage(chores, c)).toBe(-1);
    expect(questLog({ q_chores: chores }, c)).toEqual([]);
    c.state.flags.st_farm_day = 1;
    expect(questStage(chores, c)).toBe(0);
    expect(evalCond({ k: 'quest', id: 'q_chores', gte: 0 }, c)).toBe(true);
    c.state.flags.q_sheep_d1 = true;
    expect(questLog({ q_chores: chores }, c)).toEqual([
      { id: 'q_chores', name: chores.name, text: { en: 'Done', sv: 'Klart' }, done: true },
    ]);
  });
});

describe('applyEffect', () => {
  it('sets and adds flags, clamped to their spec', () => {
    const { sim } = new Harness();
    applyEffect({ k: 'set', flag: 'q_sheep_d1', value: true }, sim);
    applyEffect({ k: 'add', flag: 'st_farm_day', n: 5 }, sim);
    applyEffect({ k: 'add', flag: 'q_logs', n: -3 }, sim);
    expect(sim.state.flags).toMatchObject({ q_sheep_d1: true, st_farm_day: 3, q_logs: 0 });
  });

  it('gives slot items into the first free slot and takes them back out', () => {
    const h = new Harness();
    applyEffect({ k: 'give', item: 'lantern' }, h.sim);
    applyEffect({ k: 'give', item: 'flatbread', n: 20 }, h.sim);
    expect(h.sim.state.inv.slots).toEqual(['lantern', null]);
    expect(h.sim.state.inv.items.flatbread).toBe(9);
    expect(h.sim.drainEvents().filter((e) => e.t === 'itemGet')).toHaveLength(2);
    applyEffect({ k: 'take', item: 'lantern' }, h.sim);
    expect(h.sim.state.inv.slots).toEqual([null, null]);
    expect(h.sim.state.inv.items.lantern).toBeUndefined();
  });

  it('keeps silver within the purse and health within max', () => {
    const { sim } = new Harness();
    applyEffect({ k: 'silver', n: 500 }, sim);
    expect(sim.state.hero.silver).toBe(PURSE_CAP[0]);
    applyEffect({ k: 'silver', n: -500 }, sim);
    expect(sim.state.hero.silver).toBe(0);
    sim.hero.hp = 3;
    applyEffect({ k: 'heal', n: 2 }, sim);
    expect(sim.hero.hp).toBe(5);
    applyEffect({ k: 'heal', n: 0 }, sim);
    expect(sim.hero.hp).toBe(sim.hero.maxHp);
  });

  it('sleeps to the next morning', () => {
    const { sim } = new Harness({ minute: 21 * 60 });
    const day = sim.state.clock.day;
    applyEffect({ k: 'sleep', until: 6 * 60 }, sim);
    expect(sim.state.clock.day).toBe(day + 1);
    expect(sim.state.clock.minute).toBe(6 * 60);
    expect(sim.drainEvents()).toContainEqual({ t: 'clock', e: { t: 'newDay', day: day + 1 } });
  });
});
