import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCREEN_IDS } from '@content/world/screens';
import { loadSave } from '@core/state/save';
import type { GameState } from '@core/state/gameState';
import { Harness } from './harness';
import { face, finishStory, talkTo, walkTo } from './walk';
import { frameOf } from './harness';

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

  it('has basins of meltwater inside that make Ask whole, seiðr and all', () => {
    const s = m9b();
    s.flags.st_utgard_open = true;
    s.flags.st_d8_entered = true;
    s.hero.hp = 10;
    s.hero.seidr = 0;
    const h = new Harness({ state: s, screen: 'd8_r37', tile: [31, 4], facing: 'n' });
    h.sim.god = true;
    h.idle(2);
    walkTo(h, 31, 3);
    face(h, 'n');
    h.step(frameOf([], ['interact']));
    finishStory(h);
    expect(h.sim.hero.hp).toBe(h.sim.hero.maxHp);
    expect(h.sim.state.hero.seidr).toBe(h.sim.state.hero.maxSeidr);
  });
});
