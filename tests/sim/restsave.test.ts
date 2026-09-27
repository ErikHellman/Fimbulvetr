import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { makeSave, loadSave } from '@core/state/save';
import { Sim } from '@core/sim/sim';
import { Harness } from './harness';

/** test_a with an altar (a `use` at 20,8) whose script heals, offers the slots, then speaks. */
function hofDb(): ContentDb {
  const screen = {
    ...DB.screens.test_a,
    things: [{ k: 'use' as const, at: { x: 20, y: 8 }, script: 'dev_script' as const }],
  };
  return {
    ...DB,
    screens: { ...DB.screens, test_a: screen },
    scripts: {
      ...DB.scripts,
      dev_script: {
        steps: [
          { k: 'do', effects: [{ k: 'heal', n: 0 }] },
          { k: 'save' },
          { k: 'say', who: null, text: { en: 'Rested.', sv: 'Utvilad.' } },
        ],
      },
    },
  };
}

function atAltar(): Harness {
  const h = new Harness({ db: hofDb(), tile: [20, 9], facing: 'n' });
  h.sim.state.hero.hp = 4;
  h.sim.hero.hp = 4;
  return h;
}

describe('the save step', () => {
  it('waits with the slot picker up until the shell says it saved', () => {
    const h = atAltar();
    h.press(['interact']);
    h.idle(30);
    expect(h.sim.mode).toBe('story');
    expect(h.sim.storyUi()).toEqual({ k: 'save' });
    expect(h.sim.state.hero.hp).toBe(h.sim.state.hero.maxHp);
    h.sim.command({ t: 'saved' });
    h.idle(1);
    expect(h.sim.storyUi()?.k).toBe('text');
  });

  it('ignores a stray saved command outside a save step', () => {
    const h = atAltar();
    h.sim.command({ t: 'saved' });
    h.idle(1);
    expect(h.sim.story).toBeNull();
    expect(h.sim.hash()).toBe(atAltar().idle(1).sim.hash());
  });

  it('writes a snapshot that loads back into play on the same spot', () => {
    const h = atAltar();
    h.press(['interact']).idle(30);
    const save = makeSave(h.sim.snapshot(), 'test', '2026-09-27T12:00:00Z');
    const loaded = loadSave(JSON.parse(JSON.stringify(save)), new Set(Object.keys(DB.screens)));
    if (!loaded.ok) throw new Error(loaded.error.detail);
    const again = new Sim(hofDb(), loaded.state, { longDay: false, rolled: false });
    expect(again.mode).toBe('play');
    expect(again.screen.id).toBe('test_a');
    expect(again.state.hero.hp).toBe(again.state.hero.maxHp);
  });
});
