import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NEW_GAME } from '@content/start';
import { newGame, type GameState } from '@core/state/gameState';
import { Autosaver } from '@shell/platform/autosave';

const state = (ticks: number): GameState => ({ ...newGame(1, NEW_GAME), playTicks: ticks });

function setup(fail = false): { saver: Autosaver; writes: number[]; errors: unknown[] } {
  const writes: number[] = [];
  const errors: unknown[] = [];
  const saver = new Autosaver({
    write: (s) => {
      if (fail) return Promise.reject(new Error('disk full'));
      writes.push(s.playTicks);
      return Promise.resolve();
    },
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (h) => {
      clearTimeout(h as number);
    },
    minIntervalMs: 4000,
    onError: (e) => errors.push(e),
  });
  return { saver, writes, errors };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('Autosaver', () => {
  it('writes the first request immediately', async () => {
    const { saver, writes } = setup();
    saver.request(state(1));
    await vi.advanceTimersByTimeAsync(0);
    expect(writes).toEqual([1]);
  });

  it('coalesces requests inside the interval into one trailing write of the latest state', async () => {
    const { saver, writes } = setup();
    saver.request(state(1));
    await vi.advanceTimersByTimeAsync(0);
    saver.request(state(2));
    saver.request(state(3));
    expect(writes).toEqual([1]);
    await vi.advanceTimersByTimeAsync(4000);
    expect(writes).toEqual([1, 3]);
  });

  it('flushes a pending state at once (tab hidden, page closing)', async () => {
    const { saver, writes } = setup();
    saver.request(state(1));
    await vi.advanceTimersByTimeAsync(0);
    saver.request(state(2));
    await saver.flush();
    expect(writes).toEqual([1, 2]);
  });

  it('reports write errors instead of throwing', async () => {
    const { saver, errors } = setup(true);
    saver.request(state(1));
    await vi.advanceTimersByTimeAsync(0);
    expect(errors).toHaveLength(1);
  });
});
