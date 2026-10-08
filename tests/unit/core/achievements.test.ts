import { describe, expect, it } from 'vitest';
import { TEST_START } from '@content/start';
import { earned, fresh, type AchievementDef } from '@core/progress/achievements';
import { newGame } from '@core/state/gameState';
import type { CondCtx } from '@core/story/cond';

const DEFS: readonly AchievementDef[] = [
  {
    id: 'ach_raid',
    name: { en: 'Raid', sv: 'Räd' },
    hint: { en: 'Survive', sv: 'Överlev' },
    when: { k: 'flag', id: 'st_raid_done' },
  },
  {
    id: 'ach_stone1',
    name: { en: 'Stone', sv: 'Sten' },
    hint: { en: 'Light', sv: 'Tänd' },
    when: { k: 'flag', id: 'st_stone1_lit' },
  },
];

const ctx = (): CondCtx => ({ state: newGame(1, TEST_START), quests: {} });

describe('achievements', () => {
  it('lists the ones whose condition holds, in definition order', () => {
    const c = ctx();
    expect(earned(DEFS, c)).toEqual([]);
    c.state.flags.st_stone1_lit = true;
    expect(earned(DEFS, c)).toEqual(['ach_stone1']);
    c.state.flags.st_raid_done = true;
    expect(earned(DEFS, c)).toEqual(['ach_raid', 'ach_stone1']);
  });

  it('reports only the ones not already held', () => {
    const c = ctx();
    c.state.flags.st_raid_done = true;
    c.state.flags.st_stone1_lit = true;
    expect(fresh(DEFS, c, new Set(['ach_raid']))).toEqual(['ach_stone1']);
    expect(fresh(DEFS, c, new Set(['ach_raid', 'ach_stone1']))).toEqual([]);
  });
});
