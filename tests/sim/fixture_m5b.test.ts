import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { ownedRings } from '@shell/ui/pauseMenu';
import { frameOf } from './harness';

/**
 * The save committed at the end of M5b (still format v1): the demo route's end (New Game to the credits,
 * seed 1), then the M5b content finished as its rewards give it: both farm stages, the trades to Kári's
 * hook, the ten side quests, Hlíf, both arm-rings (thrift worn). Ask stands in the farmyard at noon in the
 * Fimbulvetr winter. Every later build must keep loading it.
 */
describe('v1-m5b fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m5b.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('ask_farmyard');
    expect(result.state.clock.season).toBe('winter');
    expect(result.state.flags).toMatchObject({ st_pass_open: true, q_farm: 2, q_trade: 3 });
    expect(result.state.inv.ring).toBe('ring_thrift');
    expect(ownedRings(result.state)).toEqual(['ring_stamina', 'ring_thrift']);
    expect(result.state.world.pieces).toEqual(
      expect.arrayContaining(['hp_hau_heath', 'hp_ask_village', 'hp_upp_range', 'hp_upp_bay']),
    );
  });

  it('runs: Halvar works the rebuilt yard, and every M5b quest in the log is done', () => {
    // The farm's stages 1–2 are done; it goes on in M8b once Þorkell is home (`q_farm` 3).
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    expect(sim.actors.some((a) => a.kind === 'npc' && a.def === 'halvar')).toBe(true);
    expect(sim.actors.filter((a) => a.art === 'fix_scorch')).toHaveLength(0);
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_farm')?.text.en).toContain('must wait for ore');
    for (const id of [
      'q_herd',
      'q_pages',
      'q_trolls',
      'q_steinn',
      'q_barrow_ring',
      'q_crates',
      'q_honey',
      'q_axes',
      'q_amber',
      'q_burbot',
    ])
      expect(log.find((q) => q.id === id)?.done, id).toBe(true);
    expect(log.find((q) => q.id === 'q_trade')?.done).toBe(false);
  });
});
