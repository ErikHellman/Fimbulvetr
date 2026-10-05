import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { frameOf } from './harness';

/**
 * The save committed at the end of M9a (still format v1): the M8b save played through the M9a route (a
 * prayer at the Refuge, up past the frost line, the glacier's piece, the beacon lit for Ormr, Embla's third
 * letter, the saddle's ore, the icefall and the tarn's chests, and the cairn) and ended by Hrímfjöll's warp
 * stone on the beacon hill. Every later build must keep loading it.
 */
describe('v1-m9a fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m9a.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('hrf_beacon');
    expect(result.state.flags).toMatchObject({
      st_hrf_reached: true,
      st_beacon_lit: true,
      w_ring_beacon: true,
      st_letter3_found: true,
      q_letters: 3,
      q_trade: 7,
    });
    expect(result.state.world.warps).toContain('hrimfjoll');
    expect(result.state.world.pieces).toContain('hp_hrf_glacier');
    expect(result.state.world.opened).toEqual(
      expect.arrayContaining(['hrf_c_icefall', 'hrf_c_ore', 'hrf_c_tarn', 'hrf_k_ore']),
    );
  });

  it('runs: the beacon burns on its hill, and the letters are done', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    expect(sim.actors.some((a) => a.kind === 'fixture' && a.def === 'fire')).toBe(true);
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_letters')?.done).toBe(true);
  });
});
