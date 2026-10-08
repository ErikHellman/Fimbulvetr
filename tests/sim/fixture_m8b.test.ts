import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { frameOf } from './harness';

/**
 * The save committed at the end of M8b (still format v1): the M8a save played through the M8b route (a
 * prayer at the Refuge, Ívaldi's Forge from the gate to the thane's fall, the scree's stakes, and home by
 * the cart road to Þorkell's goat-house) and ended in Askdalr's village. Every later build must keep
 * loading it.
 */
describe('v1-m8b fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m8b.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('ask_village');
    expect(result.state.flags).toMatchObject({
      st_thane_ivaldi: true,
      st_d6_boss_dead: true,
      st_freed_thorkell: true,
      st_freed_rannveig: true,
      q_thanes: 3,
      q_captives: 6,
      q_farm: 3,
    });
    expect(result.state.inv.items.hammer).toBe(1);
    expect(result.state.inv.galdr).toContain('skjalfti');
    expect(result.state.world.pieces).toEqual(expect.arrayContaining(['hp_d6_r21', 'hp_dvg_scree']));
    expect(result.state.world.opened).toContain('d6_hc');
  });

  it('runs: Þorkell and Rannveig are home, and the forge quest is done', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    expect(sim.actors.some((a) => a.kind === 'npc' && a.def === 'thorkell')).toBe(true);
    expect(sim.actors.some((a) => a.kind === 'npc' && a.def === 'rannveig')).toBe(true);
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_forge')?.done).toBe(true);
  });
});
