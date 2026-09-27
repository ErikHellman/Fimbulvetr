import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave } from '@core/state/save';
import { coverAt } from '@core/world/cover';
import { frameOf } from './harness';

/**
 * The save committed at the end of M2a (still format v1): a winter morning on myr_deep, with a path cut
 * through the snow by the drifts. Every later build must keep loading it.
 */
describe('v1-m2a fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m2a.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.clock.season).toBe('winter');
    expect(result.state.hero.screen).toBe('myr_deep');
  });

  it('runs with the world turning: the cut path stays cut, the drifts and the rest of the snow stand', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    const cover = (x: number, y: number) => coverAt(sim.screen.cover, DB.coverOrder, x, y);
    expect(cover(10, 12)).toBeNull();
    expect(cover(5, 12)).toBe('snow');
    expect(cover(10, 7)).toBe('drift');
  });
});
