import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { frameOf } from './harness';

/**
 * The save committed at the end of M10a (still format v1): the M9b save played through the M10a route
 * (Halvar's confession at Útgarðr's gate, the three wings and their seals, Jötunvörðr and the master key,
 * and Kolbeinn beaten and spared) and ended in Kolbeinn's hall, by the open door to the binding hall. Every
 * later build must keep loading it.
 */
describe('v1-m10a fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m10a.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('d8_r13');
    expect(result.state.flags).toMatchObject({
      st_halvar_confessed: true,
      st_utgard_open: true,
      st_d8_seal_w: true,
      st_d8_seal_e: true,
      st_d8_seal_n: true,
      st_d8_warden: true,
      st_kolbeinn_beaten: true,
      st_kolbeinn_spared: true,
    });
    expect(result.state.world.pieces).toContain('hp_d8_keep');
    expect(result.state.world.opened).toEqual(expect.arrayContaining(['d8_c_bigkey', 'd8_c_cache']));
  });

  it('runs: Útgarðr is open to the binding hall, and the quest log says so', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    const king = log.find((q) => q.id === 'q_king');
    expect(king?.done).toBe(false);
    expect(king?.text.en).toContain('Kolbeinn');
  });
});
