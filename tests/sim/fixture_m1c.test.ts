import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { dungeonOf } from '@core/state/dungeons';
import { loadSave } from '@core/state/save';
import { frameOf } from './harness';

/**
 * The save committed during M1c (still format v1): deep in Rótarhellir, below the great door of the lair,
 * with the boomerang, one small key left, both switches struck and the boss still alive. Every later build
 * must keep loading it.
 */
describe('v1-m1c fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m1c.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.flags).toMatchObject({ st_d1_entered: true });
    expect(result.state.inv.slots).toEqual(['lantern', 'boomerang']);
  });

  it('runs: the great door stands open, lock A is still shut, the key is still in hand', () => {
    if (!result.ok) throw new Error(result.error.detail);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
    expect(sim.screen.id).toBe('d1_r11');
    const at = (x: number, y: number) =>
      sim.actors.find((a) => a.kind === 'fixture' && a.mem['tx'] === x && a.mem['ty'] === y)?.anim;
    expect(at(19, 0)).toBe('open');
    expect(at(0, 10)).toBe('open');
    expect(at(19, 21)).toBe('closed');
    expect(dungeonOf(sim.state, 'd1')).toMatchObject({ keys: 1, bossDead: false });
    expect(sim.state.flags.st_d1_boss_dead).toBeUndefined();
  });
});
