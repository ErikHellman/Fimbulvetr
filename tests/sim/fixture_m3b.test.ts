import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { LOW, SOLID } from '@core/world/collision';
import { frameOf } from './harness';

/**
 * The save committed at the end of M3b (still format v1): the end of the M3b route by the millpond, the
 * second runestone lit, Sökkva Kvern's doors open and its water left at the top level (2). Every later
 * build must keep loading it.
 */
describe('v1-m3b fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m3b.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('myl_mill');
    expect(result.state.flags).toMatchObject({
      st_d2_entered: true,
      st_d2_boss_dead: true,
      st_stone2_lit: true,
      w_d2_level: 2,
    });
    expect(result.state.dungeons.d2).toMatchObject({ bigKey: true, bossDead: true });
  });

  it('runs: the quest reads the lit stone, and the mill keeps its water where it was left', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_runestone_2')?.text.en).toMatch(/second runestone burns/);
    // The tail-race's planks are still afloat at level 2, and lock C still open.
    sim.command({ t: 'warp', screen: 'd2_r12', x: 20 * 16 + 8, y: 16 * 16 + 14 });
    for (let i = 0; i < 4; i++) sim.step(frameOf([]));
    const flags = (x: number, y: number): number => sim.screen.collision.flags[y * 40 + x] ?? 0;
    expect(flags(6, 10) & (SOLID | LOW)).toBe(0);
    expect(sim.actors.filter((a) => a.def === 'lock').every((a) => a.anim === 'open')).toBe(true);
    // Lindormr stays dead.
    sim.command({ t: 'warp', screen: 'd2_r15', x: 20 * 16 + 8, y: 16 * 16 + 14 });
    for (let i = 0; i < 4; i++) sim.step(frameOf([]));
    expect(sim.enemies.some((e) => e.def === 'lindormr')).toBe(false);
  });
});
