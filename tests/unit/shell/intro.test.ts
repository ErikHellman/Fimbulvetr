import { describe, expect, it } from 'vitest';
import type { Action } from '@core/input/actions';
import { INTRO_ROWS, openIntro, stepIntro, type IntroAction } from '@shell/ui/intro';
import { frameOf } from '../../sim/harness';

function run(...inputs: Action[][]) {
  let state = openIntro();
  const actions: IntroAction[] = [];
  let moves = 0;
  for (const input of inputs) {
    const r = stepIntro(state, frameOf([], input));
    state = r.state;
    if (r.moved) moves += 1;
    if (r.action !== null) actions.push(r.action);
  }
  return { state, actions, moves };
}

describe('intro', () => {
  it('opens on Begin with the box unticked, so one Enter goes straight in', () => {
    expect(INTRO_ROWS[openIntro().cursor]).toBe('begin');
    expect(openIntro().dontShow).toBe(false);
    expect(run(['confirm']).actions).toEqual([{ k: 'begin', dontShow: false }]);
    expect(run(['interact']).actions).toEqual([{ k: 'begin', dontShow: false }]);
  });

  it('ticks "don’t show again" and begins with it', () => {
    const r = run(['up'], ['confirm'], ['down'], ['confirm']);
    expect(r.actions).toEqual([{ k: 'begin', dontShow: true }]);
    expect(r.moves).toBe(4);
  });

  it('toggles the box with left and right, and wraps the cursor', () => {
    expect(run(['down'], ['right']).state.dontShow).toBe(true);
    expect(run(['down'], ['right'], ['left']).state.dontShow).toBe(false);
    expect(run(['right']).state.dontShow).toBe(false);
  });

  it('goes back to the title on cancel', () => {
    expect(run(['cancel']).actions).toEqual([{ k: 'back' }]);
    expect(run([]).moves).toBe(0);
  });
});
