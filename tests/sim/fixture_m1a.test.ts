import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { coverAt } from '@core/world/cover';
import { frameOf } from './harness';

/**
 * The save committed at the end of M1a (still format v1): day 2 of the prologue on the farmyard, with
 * int flags, penned sheep in a world var and mown grass. Every later build must keep loading it.
 */
describe('v1-m1a fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m1a.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.flags.st_farm_day).toBe(2);
  });

  it('runs: mown grass stays mown, the logs are out and the sheep are home', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.screen.id).toBe('ask_farmyard');
    expect(coverAt(sim.screen.cover, DB.coverOrder, 26, 16)).toBeNull();
    expect(coverAt(sim.screen.cover, DB.coverOrder, 26, 17)).toBe('tall_grass');
    expect(sim.actors.filter((a) => a.def.startsWith('log_')).length).toBeGreaterThan(0);
    sim.command({ t: 'warp', screen: 'ask_pasture', x: 30 * 16, y: 10 * 16 });
    sim.step(frameOf([]));
    expect(sim.actors.filter((a) => a.kind === 'critter' && a.mem['penned'] === 1)).toHaveLength(5);
  });
});
