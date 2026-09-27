import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { PURSE_CAP } from '@core/story/effects';
import { frameOf } from './harness';

/**
 * The save committed at the end of M2c (still format v1): the end of the M2c route at Uppvík's gate, the
 * vargar hunt done and paid with the bigger purse. Every later build must keep loading it.
 */
describe('v1-m2c fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m2c.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('upp_gate');
    expect(result.state.hero.purse).toBe(1);
    expect(result.state.flags).toMatchObject({ q_vargar_alpha: true, q_vargar_done: true });
  });

  it('runs: the hunt reads done, the purse holds 300, and the north road has no pack leader', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    expect(PURSE_CAP[sim.state.hero.purse]).toBe(300);
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_vargar')?.text.en).toMatch(/300 silver/);
    sim.command({ t: 'warp', screen: 'myr_north', x: 19 * 16 + 8, y: 18 * 16 + 14 });
    for (let i = 0; i < 4; i++) sim.step(frameOf([]));
    expect(sim.enemies.some((e) => e.def === 'vargr_alpha')).toBe(false);
  });
});
