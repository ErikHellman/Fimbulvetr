import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { frameOf } from './harness';

/**
 * The save committed at the end of M3a (still format v1): the end of the M3a route on Kári's jetty, the
 * weir's bridge down, Þuríðr's tale heard and a first fish landed. Every later build must keep loading it.
 */
describe('v1-m3a fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m3a.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('myl_fisher');
    expect(result.state.flags).toMatchObject({
      w_myl_bridge: true,
      st_myrland_reached: true,
      q_rs2_mill: true,
      n_kari_met: true,
      q_fish_caught: 1,
    });
  });

  it('runs: the second stone’s quest reads the mill, and the weir’s bridge is still down', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_runestone_2')?.text.en).toMatch(/Sökkva Kvern/);
    expect(log.find((q) => q.id === 'q_fisher')).toBeDefined();
    sim.command({ t: 'warp', screen: 'myl_weir', x: 20 * 16 + 8, y: 8 * 16 + 14 });
    for (let i = 0; i < 4; i++) sim.step(frameOf([]));
    const bridge = sim.actors.filter((a) => a.kind === 'fixture' && a.def === 'bridge');
    expect(bridge.length).toBe(8);
    expect(bridge.every((b) => b.anim === 'down')).toBe(true);
  });
});
