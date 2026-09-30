import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { dungeonOf } from '@core/state/dungeons';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { frameOf } from './harness';

/**
 * The save committed at the end of M4b (still format v1): the end of the M4b route, back at Haugar's
 * stone circle by Farvegr, with the bow, the King beaten and the third runestone lit. Every later build
 * must keep loading it.
 */
describe('v1-m4b fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m4b.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('hau_circle');
    expect(result.state.flags).toMatchObject({
      st_d3_entered: true,
      st_d3_warden: true,
      w_d3_r10: true,
      w_d3_r12: true,
      st_d3_boss_dead: true,
      st_stone3_lit: true,
    });
    expect(result.state.inv.items.bow).toBe(1);
    expect(result.state.inv.galdr).toContain('farvegr');
    expect(result.state.world.warps).toEqual(['haugar']);
    expect(result.state.world.opened).toContain('d3_hc');
    expect(dungeonOf(result.state, 'd3').bossDead).toBe(true);
  });

  it('runs: the quest reads the lit stone, and the barrow’s dead stay laid', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_runestone_3')?.text.en).toMatch(/third runestone burns again/);
    const warden = new Sim(DB, { ...result.state, hero: { ...result.state.hero, screen: 'd3_r09' } });
    expect(warden.enemies.filter((e) => e.def === 'haugvordr')).toHaveLength(0);
    const king = new Sim(DB, { ...result.state, hero: { ...result.state.hero, screen: 'd3_r19' } });
    expect(king.enemies.filter((e) => e.def === 'haugkonungr')).toHaveLength(0);
  });
});
