import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_DEFS, PIECE_TOTAL, WARP_TOTAL } from '@content/achievements';
import { ACHIEVEMENTS } from '@content/ids';
import { DB } from '@content/index';
import { QUEST_DEFS, SIDE_QUESTS } from '@content/quests';
import { TEST_START } from '@content/start';
import { unknownChars } from '@art/font';
import { earned } from '@core/progress/achievements';
import { newGame, type GameState } from '@core/state/gameState';
import { evalCond, type Cond, type CondCtx } from '@core/story/cond';

/** Changes a fresh state just enough for `c` to hold (the shapes the achievements use). */
function satisfy(c: Cond, s: GameState): void {
  switch (c.k) {
    case 'flag':
      s.flags[c.id] = c.gte ?? (typeof c.eq === 'number' ? c.eq : true);
      return;
    case 'galdr':
      s.inv.galdr.push(c.id);
      return;
    case 'pieces':
      for (let i = s.world.pieces.length; i < c.gte; i++) s.world.pieces.push(`hp_test_${String(i)}`);
      return;
    case 'warps':
      for (let i = s.world.warps.length; i < c.gte; i++) s.world.warps.push('askdalr');
      return;
    case 'silver':
      s.hero.silver = c.gte;
      return;
    case 'quest': {
      const q = QUEST_DEFS[c.id];
      const last = q?.stages[c.gte];
      if (last === undefined) throw new Error(`no stage ${String(c.gte)} of ${c.id}`);
      satisfy(last.when, s);
      return;
    }
    case 'all':
      c.of.forEach((x) => {
        satisfy(x, s);
      });
      return;
    default:
      throw new Error(`cannot satisfy ${c.k}`);
  }
}

const ctxOf = (state: GameState): CondCtx => ({ state, quests: QUEST_DEFS });

describe('achievements', () => {
  it('defines every id once, in the id list’s order', () => {
    expect(ACHIEVEMENT_DEFS.map((a) => a.id)).toEqual([...ACHIEVEMENTS]);
    expect(ACHIEVEMENTS).toHaveLength(24);
  });

  it('writes every name and hint in both languages with drawable characters', () => {
    for (const a of ACHIEVEMENT_DEFS)
      for (const text of [a.name, a.hint])
        for (const lang of ['en', 'sv'] as const) {
          expect(text[lang].length, `${a.id} ${lang}`).toBeGreaterThan(0);
          expect(unknownChars(text[lang]), `${a.id} ${lang}`).toEqual([]);
        }
  });

  it('holds none on a new game', () => {
    expect(earned(ACHIEVEMENT_DEFS, ctxOf(newGame(1, TEST_START)))).toEqual([]);
  });

  it.each(ACHIEVEMENT_DEFS.map((a) => [a.id, a] as const))('earns %s once its condition is met', (id, a) => {
    const s = newGame(1, TEST_START);
    satisfy(a.when, s);
    expect(earned(ACHIEVEMENT_DEFS, ctxOf(s))).toContain(id);
  });

  it('counts eight warp stones and 36 heart pieces, as many as the game holds', () => {
    expect(WARP_TOTAL).toBe(8);
    expect(PIECE_TOTAL).toBe(36);
    // Every piece in the content: lying on a screen, or handed over by a dialogue or a script.
    const ids = new Set<string>();
    const walk = (v: unknown): void => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (typeof v === 'object' && v !== null) {
        const o = v as Record<string, unknown>;
        if (o['k'] === 'piece' && typeof o['id'] === 'string') ids.add(o['id']);
        Object.values(o).forEach(walk);
      }
    };
    walk(DB);
    expect(ids.size).toBe(PIECE_TOTAL);
  });

  it('lists the 25 side quests, each once and each defined', () => {
    expect(SIDE_QUESTS).toHaveLength(25);
    expect(new Set(SIDE_QUESTS).size).toBe(SIDE_QUESTS.length);
    for (const id of SIDE_QUESTS) expect(QUEST_DEFS[id], id).toBeDefined();
  });

  it('starts with every flag-based side quest undone', () => {
    const s = newGame(1, TEST_START);
    const done = SIDE_QUESTS.filter((id) => {
      const q = QUEST_DEFS[id];
      return q !== undefined && evalCond({ k: 'quest', id, gte: q.stages.length - 1 }, ctxOf(s));
    });
    expect(done).toEqual([]);
  });
});
