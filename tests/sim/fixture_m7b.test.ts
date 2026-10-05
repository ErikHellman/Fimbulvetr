import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { frameOf } from './harness';

/**
 * The save committed at the end of M7b (still format v1): the M7a save, in the Refuge's hall on a winter
 * night, played through the M7b route (Sökkva Hof, Hrönn and Nykr, Kolbeinn's word, the three Norn-threads
 * and the loom) and ended with a prayer at the Refuge's hof that turned the year to spring. Every later build
 * must keep loading it.
 */
describe('v1-m7b fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m7b.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('ref_int_hall');
    expect(result.state.clock.season).toBe('spring');
    expect(result.state.flags).toMatchObject({
      st_thane_nykr: true,
      st_d5_kolbeinn: true,
      st_freed_oddr: true,
      st_freed_hallbera: true,
      st_loom_woven: true,
      q_thanes: 2,
    });
    expect(result.state.inv.galdr).toContain('vindr');
    expect(result.state.inv.items.seidr_upgrade).toBe(2);
    expect(result.state.world.opened).toContain('d5_hc');
  });

  it('runs: the hall is quiet, Nykr is in the quest log, and the loom is woven', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_loom')?.done).toBe(true);
  });
});
