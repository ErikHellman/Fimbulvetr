import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { frameOf } from './harness';

/**
 * The save committed at the end of M8a (still format v1): the M7b save played through the M8a route (over
 * the chasm, Hekla led to the lamp-room, the cart road opened, Sindri's byrnie and lens, Embla's second
 * letter and the tarn's cairn) and ended by Farvegr at Dvergagröf's stone. Every later build must keep
 * loading it.
 */
describe('v1-m8a fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m8a.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('dvg_chasm');
    expect(result.state.flags).toMatchObject({
      st_dvg_reached: true,
      q_foreman: 5,
      q_trade: 6,
      q_letters: 2,
      st_letter2_found: true,
    });
    expect(result.state.inv.armor).toBe('ember_byrnie');
    expect(result.state.world.warps).toContain('dvergagrof');
    expect(result.state.world.pieces).toContain('hp_hau_tarn_letter');
  });

  it('runs: the chasm is quiet, and the foreman’s crew is out', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    expect(sim.escortHp()).toBeNull();
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_foreman')?.done).toBe(true);
  });
});
