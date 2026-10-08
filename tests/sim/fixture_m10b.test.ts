import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { frameOf } from './harness';

/**
 * The save committed at the end of M10b (still format v1): the M10a save played through the M10b route
 * (Embla holds the binding, Hrímnir falls, the ending with Ask staying, and the final credits) and ended at
 * the farm on a spring morning after the game is done. Every later build must keep loading it.
 */
describe('v1-m10b fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m10b.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('ask_farmyard');
    expect(result.state.flags).toMatchObject({
      st_d8_embla: true,
      st_hrimnir_dead: true,
      st_end_stay: true,
      st_game_done: true,
    });
    expect(result.state.clock.season).toBe('spring');
  });

  it('runs: the game is done, the mountain has thawed and the quest log says so', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    expect(sim.actors.some((a) => a.kind === 'npc' && a.def === 'embla')).toBe(true);
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_king')?.done).toBe(true);
  });
});
