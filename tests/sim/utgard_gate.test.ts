import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCREEN_IDS } from '@content/world/screens';
import { loadSave } from '@core/state/save';
import type { GameState } from '@core/state/gameState';
import { Harness } from './harness';
import { talkTo, walkTo } from './walk';

function m9b(): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m9b.json', import.meta.url), 'utf8'),
  );
  const r = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!r.ok) throw new Error(r.error.detail);
  return r.state;
}

describe('Útgarðr’s gate (M10a)', () => {
  it('stays shut until Halvar, up from the farm, confesses and speaks the binding-words', () => {
    const h = new Harness({ state: m9b(), screen: 'hrf_utgard', tile: [20, 12], facing: 'n' });
    h.sim.god = true;
    h.idle(2);
    walkTo(h, 20, 9);
    h.idle(10);
    expect(h.sim.hero.pos.y).toBeGreaterThan(7 * 16);
    expect(h.sim.state.flags.st_utgard_open).not.toBe(true);
    talkTo(h, 'halvar');
    expect(h.sim.state.flags.st_halvar_confessed).toBe(true);
    expect(h.sim.state.flags.st_utgard_open).toBe(true);
    walkTo(h, 20, 6);
    expect(Math.floor(h.sim.hero.pos.y / 16)).toBe(6);
  });
});
