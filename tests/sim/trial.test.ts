import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { ScriptDef } from '@core/story/script';
import { tileFeet } from '@core/world/screen';
import { Harness, frameOf } from './harness';
import { finishStory } from './walk';

/**
 * test_a with a trial: a trigger under Ask starts it (60 ticks to strike the latch at (11, 10)); winning
 * and losing each set a flag. The scripts borrow ids the content already has.
 */
function course(ticks = 60): ContentDb {
  const start: ScriptDef = {
    steps: [
      { k: 'do', effects: [{ k: 'set', flag: 'st_rime_open', value: true }] },
      {
        k: 'trial',
        ticks,
        done: { k: 'flag', id: 'w_myl_bridge' },
        win: 'duel_won',
        fail: 'duel_lost',
      },
    ],
  };
  const won: ScriptDef = { steps: [{ k: 'do', effects: [{ k: 'set', flag: 'q_duel_won', value: true }] }] };
  const lost: ScriptDef = {
    steps: [{ k: 'do', effects: [{ k: 'set', flag: 'q_duel_asked', value: true }] }],
  };
  return {
    ...DB,
    scripts: { ...DB.scripts, pass_open: start, duel_won: won, duel_lost: lost },
    screens: {
      ...DB.screens,
      test_a: {
        ...DB.screens.test_a,
        things: [
          {
            k: 'trigger',
            at: { x: 10, y: 10 },
            w: 1,
            h: 1,
            script: 'pass_open',
            when: { k: 'not', c: { k: 'flag', id: 'st_rime_open' } },
          },
          { k: 'switch', at: { x: 11, y: 10 }, set: 'w_myl_bridge' },
        ],
      },
    },
  };
}

function begun(ticks?: number): Harness {
  const h = new Harness({ db: course(ticks), tile: [10, 10], facing: 'e' });
  h.idle(2);
  if (h.sim.mode === 'story') finishStory(h);
  return h;
}

describe('trials', () => {
  it('run the sand down while Ask plays, shown by the sim', () => {
    const h = begun();
    const t = h.sim.trial();
    expect(t?.of).toBe(60);
    h.idle(10);
    expect(h.sim.trial()?.left).toBe((t?.left ?? 0) - 10);
  });

  it('are won the tick their goal holds', () => {
    const h = begun();
    h.step(frameOf([], ['sword'])).idle(20);
    expect(h.sim.state.flags.w_myl_bridge).toBe(true);
    if (h.sim.mode === 'story') finishStory(h);
    expect(h.sim.state.flags.q_duel_won).toBe(true);
    expect(h.sim.state.flags.q_duel_asked).not.toBe(true);
    expect(h.sim.trial()).toBeNull();
  });

  it('are lost when the sand runs out', () => {
    const h = begun(30);
    h.idle(40);
    if (h.sim.mode === 'story') finishStory(h);
    expect(h.sim.state.flags.q_duel_asked).toBe(true);
    expect(h.sim.state.flags.q_duel_won).not.toBe(true);
    expect(h.sim.trial()).toBeNull();
  });

  it('are lost by leaving the screen, and never saved', () => {
    const h = begun();
    expect(JSON.stringify(h.sim.snapshot())).not.toContain('trial');
    const p = tileFeet({ x: 10, y: 10 });
    h.sim.command({ t: 'warp', screen: 'test_b', x: p.x, y: p.y });
    h.idle(4);
    if (h.sim.mode === 'story') finishStory(h);
    expect(h.sim.state.flags.q_duel_asked).toBe(true);
    expect(h.sim.trial()).toBeNull();
  });
});
