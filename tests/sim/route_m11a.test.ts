import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_DEFS } from '@content/achievements';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import type { GameState } from '@core/state/gameState';
import { loadSave } from '@core/state/save';
import { earned } from '@core/progress/achievements';
import { playM11a } from './routes/m11a';

/** The M10b save: spring at the farm after the ending. */
function m10b(): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m10b.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  return loaded.state;
}

describe('M11a route', () => {
  it('plays from the M10b save: the rune-record, the spring feast and the hidden pieces', () => {
    const h = playM11a(m10b());
    expect(h.sim.state.flags.q_record_done).toBe(true);
    expect(h.sim.state.flags.q_feast_done).toBe(true);
    expect(h.sim.state.world.pieces).toEqual(
      expect.arrayContaining([
        'hp_record',
        'hp_feast',
        'hp_hau_sinkhole',
        'hp_dvg_store',
        'hp_dvg_slag',
        'hp_hrf_thaw',
        'hp_nif_gjoll',
      ]),
    );
    const got = earned(ACHIEVEMENT_DEFS, { state: h.sim.state, quests: DB.quests });
    expect(got).toEqual(expect.arrayContaining(['ach_record', 'ach_feast', 'ach_king', 'ach_stay']));
    const c = h.sim.state.clock;
    console.log(
      `M11a route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)}, ${c.season}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}, pieces ${String(h.sim.state.world.pieces.length)}, achievements ${got.join(' ')}`,
    );
  }, 600_000);

  it('replays identically', () => {
    expect(playM11a(m10b()).sim.hash()).toBe(playM11a(m10b()).sim.hash());
  }, 900_000);
});
