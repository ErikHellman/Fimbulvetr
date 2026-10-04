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
 * The save committed at the end of M5a (still format v1): the end of the M5a route, at the open pass in
 * the Fimbulvetr, with Styrr's duel won, Bragð learned and the credits seen. Every later build must keep
 * loading it.
 */
describe('v1-m5a fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m5a.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('hau_pass');
    expect(result.state.clock.season).toBe('winter');
    expect(result.state.flags).toMatchObject({
      q_duel_won: true,
      st_bragd_learned: true,
      st_pass_open: true,
    });
    expect(result.state.inv.galdr).toContain('bragd');
  });

  it('runs: the door stays open, the rime holds, and Askdalr is waiting', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    const slab = sim.actors.filter((a) => a.art === 'fix_slab').map((a) => a.anim);
    expect(slab.every((a) => a === 'open')).toBe(true);
    expect(sim.actors.filter((a) => a.art === 'fix_rime').every((a) => a.anim === 'closed')).toBe(true);
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_fimbulvetr')?.text.en).toMatch(/Go home to Askdalr/);
    const p = tileFeet({ x: 20, y: 18 });
    const home = new Sim(DB, {
      ...result.state,
      hero: { ...result.state.hero, screen: 'ask_farmyard', x: p.x, y: p.y },
    });
    for (let i = 0; i < 4; i++) home.step(frameOf([]));
    expect(home.mode).toBe('story');
  });
});
