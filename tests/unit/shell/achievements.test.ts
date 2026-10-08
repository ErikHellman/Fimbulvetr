import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_DEFS } from '@content/achievements';
import { QUEST_DEFS } from '@content/quests';
import { TEST_START } from '@content/start';
import type { Action } from '@core/input/actions';
import { newGame } from '@core/state/gameState';
import {
  ACHIEVEMENTS_KEY,
  loadAchievements,
  parseAchievements,
  saveAchievements,
} from '@shell/platform/achievements';
import type { StorageLike } from '@shell/platform/settings';
import { achievementLines, openAchievements, stepAchievements } from '@shell/ui/achievementsPage';
import { progressLine } from '@shell/ui/progressText';
import { TOAST_TICKS, noToasts, pushToasts, tickToasts } from '@shell/ui/toast';
import { frameOf } from '../../sim/harness';

const press = (a: Action) => frameOf([], [a]);

const memory = (data: Record<string, string> = {}): StorageLike & { data: Record<string, string> } => ({
  data,
  getItem: (k) => data[k] ?? null,
  setItem: (k, v) => {
    data[k] = v;
  },
});

const throwing: StorageLike = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

describe('the achievement store', () => {
  it('keeps known ids and drops the rest', () => {
    expect([...parseAchievements(JSON.stringify(['ach_raid', 'nope', 3, 'ach_king']))]).toEqual([
      'ach_raid',
      'ach_king',
    ]);
    expect(parseAchievements('not json').size).toBe(0);
    expect(parseAchievements(JSON.stringify({ a: 1 })).size).toBe(0);
    expect(parseAchievements(null).size).toBe(0);
  });

  it('round-trips through storage and survives storage that throws', () => {
    const s = memory();
    expect(saveAchievements(s, new Set(['ach_raid', 'ach_go']))).toBe(true);
    expect(JSON.parse(s.data[ACHIEVEMENTS_KEY] ?? '[]')).toEqual(['ach_raid', 'ach_go']);
    expect([...loadAchievements(s)]).toEqual(['ach_raid', 'ach_go']);
    expect(loadAchievements(throwing).size).toBe(0);
    expect(saveAchievements(throwing, new Set(['ach_raid']))).toBe(false);
    expect(loadAchievements(null).size).toBe(0);
  });
});

describe('the toast queue', () => {
  it('shows each new achievement in turn for a while', () => {
    let q = pushToasts(noToasts(), ['ach_raid', 'ach_stone1']);
    expect(q.shown).toBe('ach_raid');
    for (let i = 0; i < TOAST_TICKS; i++) q = tickToasts(q);
    expect(q.shown).toBe('ach_stone1');
    q = pushToasts(q, ['ach_king']);
    expect(q.shown).toBe('ach_stone1');
    for (let i = 0; i < TOAST_TICKS; i++) q = tickToasts(q);
    expect(q.shown).toBe('ach_king');
    for (let i = 0; i < TOAST_TICKS; i++) q = tickToasts(q);
    expect(q.shown).toBeNull();
  });
});

describe('the achievements page', () => {
  it('moves the cursor through two columns and closes on cancel', () => {
    let p = openAchievements();
    expect(p.cursor).toBe(0);
    p = stepAchievements(p, press('down')).state ?? p;
    expect(p.cursor).toBe(1);
    p = stepAchievements(p, press('right')).state ?? p;
    expect(p.cursor).toBe(13);
    p = stepAchievements(p, press('left')).state ?? p;
    expect(p.cursor).toBe(1);
    p = stepAchievements(p, press('up')).state ?? p;
    p = stepAchievements(p, press('up')).state ?? p;
    expect(p.cursor).toBe(ACHIEVEMENT_DEFS.length - 1);
    expect(stepAchievements(p, press('cancel')).state).toBeNull();
    expect(stepAchievements(p, frameOf([])).moved).toBe(false);
  });

  it('marks earned ones, counts them and shows the chosen one’s hint', () => {
    const lines = achievementLines(openAchievements(), new Set(['ach_stone1']), 'en');
    expect(lines.heading).toBe('Achievements: 1 of 24');
    expect(lines.left).toHaveLength(12);
    expect(lines.right).toHaveLength(12);
    expect(lines.left[0]).toBe('> The long night');
    expect(lines.earned[1]).toBe(true);
    expect(lines.earned[0]).toBe(false);
    expect(lines.hint).toBe('Live through the raid on Askdalr.');
  });
});

describe('the progress footer', () => {
  it('counts heart pieces, side quests and achievements', () => {
    const s = newGame(1, TEST_START);
    s.world.pieces.push('hp_ask_village');
    s.flags.q_fish_gamli = true;
    const line = progressLine({ state: s, quests: QUEST_DEFS }, new Set(['ach_raid', 'ach_gamli']), 'en');
    expect(line).toMatch(/^Heart pieces 1\/36 · Side quests \d+\/\d+ · Achievements 2\/24$/);
  });
});
