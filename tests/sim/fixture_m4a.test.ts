import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { SOLID } from '@core/world/collision';
import { frameOf } from './harness';

/**
 * The save committed at the end of M4a (still format v1): the end of the M4a route before the King's
 * Barrow at night, the rockfall blown, Haugar's warp stone awake, both of Styrr's lessons learned and the
 * barrow-watch kept. Every later build must keep loading it.
 */
describe('v1-m4a fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m4a.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('hau_king');
    expect(result.state.flags).toMatchObject({
      st_haugar_reached: true,
      q_rs3_watch: true,
      q_watch_kills: 3,
      st_barrow_open: true,
      t_dash: true,
      t_parry: true,
    });
    expect(result.state.world.warps).toEqual(['haugar']);
    expect(result.state.world.opened).toContain('hau_k_gully');
  });

  it('runs: the quest reads the open barrow, and its door stays open', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_runestone_3')?.text.en).toMatch(/Barrow stands open/);
    expect(log.find((q) => q.id === 'q_huscarl')?.text.en).toMatch(/parry/);
    const g = sim.screen.collision;
    expect((g.flags[10 * g.cols + 19] ?? SOLID) & SOLID).toBe(0);
    expect(sim.enemies.filter((e) => e.def === 'haugbui')).toHaveLength(0);
  });
});
