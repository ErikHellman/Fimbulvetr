import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { coverAt } from '@core/world/cover';
import { frameOf } from './harness';

/**
 * The save committed at the end of M1b (still format v1): after the raid and the legend, in Myrkviðr's
 * old pines in autumn with the clock cycling, seax and shield in hand, the hidden piece of heart taken
 * and its leaf pile cut. Every later build must keep loading it.
 */
describe('v1-m1b fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m1b.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.flags).toMatchObject({ st_raid_done: true, st_legend_told: true });
    expect(result.state.clock).toMatchObject({ season: 'autumn', policy: 'cycling' });
  });

  it('runs: the piece stays taken, the cut leaves stay cut, the vargr hunts', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    expect(sim.screen.id).toBe('myr_pines');
    expect(sim.actors.filter((a) => a.kind === 'pickup')).toHaveLength(0);
    expect(coverAt(sim.screen.cover, DB.coverOrder, 12, 15)).toBeNull();
    expect(coverAt(sim.screen.cover, DB.coverOrder, 10, 16)).toBe('leaves');
    expect(sim.state.inv).toMatchObject({ weapon: 'seax', shield: true });
    expect(sim.enemies.map((e) => e.def)).toContain('vargr');
  });
});
