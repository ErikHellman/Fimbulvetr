import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCREEN_IDS } from '@content/world/screens';
import { loadSave } from '@core/state/save';
import type { GameState } from '@core/state/gameState';
import { frameOf, Harness } from './harness';
import { finishStory } from './walk';

function m9b(): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m9b.json', import.meta.url), 'utf8'),
  );
  const r = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!r.ok) throw new Error(r.error.detail);
  return r.state;
}

/** The binding hall with the King just fallen, Kolbeinn spared or slain. */
function fallen(kolbeinn: 'spared' | 'slain'): Harness {
  const s = m9b();
  for (const f of ['st_utgard_open', 'st_halvar_confessed', 'st_kolbeinn_beaten', 'st_hrimnir_dead'] as const)
    s.flags[f] = true;
  s.flags[kolbeinn === 'spared' ? 'st_kolbeinn_spared' : 'st_kolbeinn_slain'] = true;
  s.hero.hp = 10;
  const h = new Harness({ state: s, screen: 'd8_r12', tile: [20, 16], facing: 'n' });
  h.sim.god = true;
  return h.idle(2);
}

/** Reads on to the end of the ending, answering Embla's question with the choice at `pick`. */
function readEnding(h: Harness, pick: 0 | 1): Harness {
  for (let i = 0; i < 20000 && h.sim.mode !== 'play'; i += 4) {
    const ui = h.sim.storyUi();
    if (ui?.k === 'text' && ui.choices.length > 1 && ui.cursor !== pick) {
      h.press(['down']);
      continue;
    }
    h.step(frameOf([], ['confirm'])).idle(3);
  }
  return finishStory(h);
}

describe('the ending (M10b)', () => {
  it('runs once the King is dead: spring comes, Embla asks, and Ask wakes at the farm', () => {
    const h = fallen('spared');
    expect(h.sim.mode).toBe('story');
    readEnding(h, 0);
    expect(h.sim.state.flags.st_game_done).toBe(true);
    expect(h.sim.state.flags.st_end_stay).toBe(true);
    expect(h.sim.state.flags.st_end_go).not.toBe(true);
    expect(h.sim.screen.id).toBe('ask_farmyard');
    expect(h.sim.state.clock.season).toBe('spring');
    expect(h.sim.hero.hp).toBe(h.sim.hero.maxHp);
  });

  it('lets Ask go with her instead', () => {
    const h = fallen('slain');
    readEnding(h, 1);
    expect(h.sim.state.flags.st_end_go).toBe(true);
    expect(h.sim.state.flags.st_end_stay).not.toBe(true);
  });

  it('rolls the final credits, not the demo’s', () => {
    const h = fallen('spared');
    let roll: string | undefined;
    for (let i = 0; i < 20000 && h.sim.mode !== 'play'; i += 4) {
      const ui = h.sim.storyUi();
      if (ui?.k === 'credits') roll = ui.roll;
      h.step(frameOf([], ['confirm'])).idle(3);
    }
    expect(roll).toBe('end');
  });

  it('never runs again once the game is done', () => {
    const h = fallen('spared');
    readEnding(h, 0);
    const again = new Harness({ state: h.sim.state, screen: 'd8_r12', tile: [20, 16], facing: 'n' });
    again.idle(5);
    expect(again.sim.mode).toBe('play');
    expect(again.sim.actors.some((a) => a.kind === 'enemy' && a.def === 'hrimnir')).toBe(false);
  });
});
