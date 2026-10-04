import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { tileFeet } from '@core/world/screen';
import { frameOf } from './harness';

/**
 * The save committed at the end of M6b (still format v1): the M6a save, stood before Helgrind's gate, played
 * through the M6b route (the grapple and Ís won, Garmr and Náströnd beaten, Ulf and Tófa freed, Kolbeinn
 * heard), then out by the rune-stone. Ask stands at the gate in Niflmýrr at 23:01. Every later build must
 * keep loading it.
 */
describe('v1-m6b fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m6b.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('nif_gate');
    expect(result.state.flags).toMatchObject({
      st_d4_boss_dead: true,
      st_thane_nastrond: true,
      st_freed_ulf: true,
      st_freed_tofa: true,
      st_d4_kolbeinn: true,
      q_thanes: 1,
      q_captives: 2,
    });
    expect(result.state.inv.galdr).toContain('is');
    expect(result.state.inv.items).toMatchObject({ grapple: 1 });
    expect(result.state.world.opened).toEqual(expect.arrayContaining(['d4_c_bigkey', 'd4_hc']));
  });

  it('runs: the act II quest has moved on, and the cells in Helgrind stand empty', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_act2')?.text.en).toMatch(/One thane down, three to go/);
    const p = tileFeet({ x: 20, y: 10 });
    sim.command({ t: 'warp', screen: 'd4_r18', x: p.x, y: p.y });
    for (let i = 0; i < 4; i++) sim.step(frameOf([]));
    expect(sim.actors.some((a) => a.kind === 'npc' && a.def === 'ulf')).toBe(false);
  });
});
