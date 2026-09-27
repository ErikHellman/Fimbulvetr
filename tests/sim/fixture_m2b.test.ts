import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { coverAt } from '@core/world/cover';
import { frameOf } from './harness';

/**
 * The save committed at the end of M2b (still format v1): the end of the M2b route on myr_north, Eldr
 * learned, a horn of red mead, and the leaf pile the first bolt burnt. Every later build must keep loading it.
 */
describe('v1-m2b fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m2b.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('myr_north');
    expect(result.state.inv.galdr).toEqual(['eldr']);
    expect(result.state.inv.items).toMatchObject({ horn: 1, mead_red: 1 });
    expect(result.state.flags).toMatchObject({ st_uppvik_reached: true, st_eldr_learned: true });
  });

  it('runs: the burnt leaves stay gone, both M2b quests are done, and Eldr still sings', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    const cover = (x: number, y: number) => coverAt(sim.screen.cover, DB.coverOrder, x, y);
    expect(cover(9, 13)).toBeNull();
    expect(cover(13, 7)).toBe('leaves');
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_eldr')?.text.en).toMatch(/You know Eldr/);
    expect(log.find((q) => q.id === 'q_uppvik')?.text.en).toMatch(/mead horn/);
    const seidr = sim.state.hero.seidr;
    sim.step(frameOf(['galdr'], ['galdr']));
    expect(sim.state.hero.seidr).toBe(seidr - 2);
  });
});
