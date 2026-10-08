import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { frameOf } from './harness';

/**
 * The save committed at the end of M7a (still format v1): the M6b save, at the gate of Helgrind, played
 * through the M7a route (three nights guarding Hrafn's nets, the seal-skin, the swim over to Holmr, Embla
 * found, the comb traded for her sail-needle and her first letter). Ask stands in the Refuge's hall on a
 * winter night. Every later build must keep loading it.
 */
describe('v1-m7a fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m7a.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('ref_int_hall');
    expect(result.state.flags).toMatchObject({
      q_sealskin_done: true,
      st_embla_found: true,
      q_trade: 5,
      q_letters: 1,
    });
    expect(result.state.inv.items).toMatchObject({ sealskin: 1, trade_needle: 1 });
    expect(result.state.world.warps).toContain('saevatn');
  });

  it('runs: Embla is in the hall, and the letter points to the glade', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    expect(sim.actors.some((a) => a.kind === 'npc' && a.def === 'embla')).toBe(true);
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_letters')?.text.en).toMatch(/glade/);
    expect(log.find((q) => q.id === 'q_sealskin')?.done).toBe(true);
  });
});
