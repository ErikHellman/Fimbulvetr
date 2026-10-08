import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { frameOf } from './harness';

/**
 * The save committed at the end of M9b (still format v1): the M9a save played through the M9b route (a
 * prayer at the Refuge, into Hrímturn, Svellr and the ice mirror, the six crystal eyes, the cells, the prism
 * walk's piece and Hrímgerðr) and ended by Hrímfjöll's warp stone on the beacon hill. Every later build must
 * keep loading it.
 */
describe('v1-m9b fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m9b.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('hrf_beacon');
    expect(result.state.flags).toMatchObject({
      st_d7_svellr: true,
      st_thane_hrimgerdr: true,
      st_freed_asa: true,
      st_freed_bjarni: true,
      q_thanes: 4,
      q_captives: 8,
    });
    expect(result.state.inv.items.mirror).toBe(1);
    expect(result.state.world.pieces).toContain('hp_d7_beam');
    expect(result.state.world.opened).toEqual(expect.arrayContaining(['d7_hc', 'd7_c_bigkey']));
  });

  it('runs: the Rime Tower is done, and the quest log says so', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_rime')?.done).toBe(true);
  });
});
