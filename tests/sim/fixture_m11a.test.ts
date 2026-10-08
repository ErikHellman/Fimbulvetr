import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_DEFS } from '@content/achievements';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { earned } from '@core/progress/achievements';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { frameOf } from './harness';

/**
 * The save committed at the end of M11a (still format v1): the M10b save played through the M11a route
 * (the four bauta-stones and the rune-record, the spring feast, and the hidden heart pieces) and ended in
 * the longhouse after the feast. Every later build must keep loading it.
 */
describe('v1-m11a fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m11a.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('ask_int_longhouse');
    expect(result.state.flags).toMatchObject({
      st_game_done: true,
      q_record_done: true,
      q_feast_done: true,
    });
    expect(result.state.world.pieces).toEqual(
      expect.arrayContaining(['hp_record', 'hp_feast', 'hp_nif_gjoll', 'hp_hrf_thaw']),
    );
  });

  it('runs: both new side quests are done and their achievements are earned', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_record')?.done).toBe(true);
    expect(log.find((q) => q.id === 'q_feast')?.done).toBe(true);
    const got = earned(ACHIEVEMENT_DEFS, { state: sim.state, quests: DB.quests });
    expect(got).toEqual(expect.arrayContaining(['ach_record', 'ach_feast']));
  });
});
