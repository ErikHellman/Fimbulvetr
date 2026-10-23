import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { QUEST_DEFS, SIDE_QUESTS } from '@content/quests';
import { SCREEN_IDS } from '@content/world/screens';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';

const defs = Object.values(QUEST_DEFS);
const side = new Set(SIDE_QUESTS);
const FIXTURES = new URL('../fixtures/saves/', import.meta.url);

describe('the quest log', () => {
  it('names who gives every side quest but the trades, and where', () => {
    for (const q of defs.filter((d) => side.has(d.id))) {
      expect(q.giver?.place, q.id).toBeDefined();
      if (q.id !== 'q_trade') expect(q.giver?.who, q.id).toBeDefined();
    }
    for (const q of defs.filter((d) => !side.has(d.id))) expect(q.giver, q.id).toBeUndefined();
  });

  it('says where to go on every stage but the last, unless the stage spans places', () => {
    const spread = new Set([
      'q_trade:0',
      'q_trade:6',
      'q_pages:0',
      'q_letters:1',
      'q_letters:3',
      'q_loom:0',
      'q_record:0',
      'q_feast:0',
    ]);
    for (const q of defs) {
      const open = q.openUntil === undefined ? q.stages.length - 1 : q.stages.length;
      q.stages.slice(0, open).forEach((st, i) => {
        if (!spread.has(`${q.id}:${String(i)}`)) expect(st.at, `${q.id}:${String(i)}`).toBeDefined();
      });
    }
  });

  it('keeps side quests done on their last stage, as achievements count them', () => {
    for (const q of defs.filter((d) => side.has(d.id))) expect(q.openUntil, q.id).toBeUndefined();
  });

  it('always has a story chapter open until the Rime King is bound', () => {
    for (const f of readdirSync(FIXTURES).filter((n) => n.endsWith('.json'))) {
      const loaded = loadSave(
        JSON.parse(readFileSync(new URL(f, FIXTURES), 'utf8')),
        new Set<string>(SCREEN_IDS),
      );
      if (!loaded.ok) throw new Error(loaded.error.detail);
      const s = loaded.state;
      if (s.flags.st_hrimnir_dead === true) continue;
      const log = questLog(QUEST_DEFS, { state: s, quests: QUEST_DEFS });
      if (log.length === 0) continue;
      const open = log.filter((l) => !side.has(l.id) && !l.done).map((l) => l.id);
      expect(open.length, `${f}: ${log.map((l) => `${l.id}${l.done ? '+' : ''}`).join(' ')}`).toBeGreaterThan(
        0,
      );
    }
  });
});
