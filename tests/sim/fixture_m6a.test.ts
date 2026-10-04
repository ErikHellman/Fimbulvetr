import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { VERSES } from '@content/verses';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { questLog } from '@core/story/quests';
import { verseMarks } from '@core/world/mapModel';
import { frameOf } from './harness';

/**
 * The save committed at the end of M6a (still format v1): the M5b save played on through the M6a route
 * (the rime melted, Niflmýrr reached, the twist heard, the comb traded), then M6a finished as its rewards
 * give it: Ljós from Heiðr, Bragi's three verses, two Ís staves (one readied), and the cairns and dead-wood
 * pieces. Ask stands by Bragi's fire at the drained camp at 23:00. Every later build must keep loading it.
 */
describe('v1-m6a fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m6a.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('nif_camp');
    expect(result.state.flags).toMatchObject({
      st_rime_open: true,
      st_niflmyrr_reached: true,
      st_twist_heard: true,
      q_trade: 4,
      q_ljos_done: true,
    });
    expect(result.state.inv.galdr).toContain('ljos');
    expect(result.state.inv.items).toMatchObject({ trade_comb: 1, stave_is: 2 });
    expect(result.state.world.pieces).toEqual(expect.arrayContaining(['hp_nif_cairns', 'hp_nif_deadwood']));
  });

  it('runs: Bragi sits by his fire, the act II quest has moved on, and the gjöll verse still marks the map', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    expect(sim.actors.some((a) => a.kind === 'npc' && a.def === 'bragi')).toBe(true);
    expect(sim.actors.some((a) => a.kind === 'npc' && a.def === 'thrall')).toBe(false);
    const log = questLog(DB.quests, { state: sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_act2')?.text.en).toMatch(/captives are being bled/);
    expect(log.find((q) => q.id === 'q_ljos')?.done).toBe(true);
    expect(verseMarks(VERSES, sim.state)).toEqual(['nif_gjoll']);
  });
});
