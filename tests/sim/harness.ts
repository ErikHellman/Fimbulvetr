import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import type { ScreenId } from '@content/world/screens';
import type { Season } from '@core/clock/types';
import { bitsOf, type Action, type InputFrame } from '@core/input/actions';
import type { Dir4 } from '@core/math/dir';
import type { ContentDb } from '@core/sim/db';
import type { SimEvent } from '@core/sim/events';
import { Sim } from '@core/sim/sim';
import { newGame } from '@core/state/gameState';
import { tileFeet } from '@core/world/screen';

export interface HarnessOptions {
  readonly screen?: ScreenId;
  readonly tile?: readonly [number, number];
  readonly facing?: Dir4;
  readonly minute?: number;
  readonly season?: Season;
  readonly seed?: number;
  readonly db?: ContentDb;
}

export function frameOf(
  held: readonly Action[],
  pressed: readonly Action[] = [],
  released: readonly Action[] = [],
): InputFrame {
  const has = (a: Action): boolean => held.includes(a);
  return {
    held: bitsOf(held),
    pressed: bitsOf(pressed),
    released: bitsOf(released),
    mx: (has('right') ? 1 : 0) - (has('left') ? 1 : 0),
    my: (has('down') ? 1 : 0) - (has('up') ? 1 : 0),
  };
}

/** Drives a real Sim headlessly with scripted input. */
export class Harness {
  readonly sim: Sim;
  readonly events: SimEvent[] = [];

  constructor(o: HarnessOptions = {}) {
    const state = newGame(o.seed ?? 1, NEW_GAME);
    if (o.screen !== undefined) state.hero.screen = o.screen;
    if (o.tile !== undefined) {
      const p = tileFeet({ x: o.tile[0], y: o.tile[1] });
      state.hero.x = p.x;
      state.hero.y = p.y;
    }
    if (o.facing !== undefined) state.hero.facing = o.facing;
    if (o.minute !== undefined) state.clock.minute = o.minute;
    if (o.season !== undefined) state.clock.season = o.season;
    this.sim = new Sim(o.db ?? DB, state);
  }

  /** Shorthand for `frameOf`, for `until` loops. */
  frame(held: readonly Action[]): InputFrame {
    return frameOf(held);
  }

  step(frame: InputFrame): this {
    this.sim.step(frame);
    this.events.push(...this.sim.drainEvents());
    return this;
  }

  idle(ticks: number): this {
    for (let i = 0; i < ticks; i++) this.step(frameOf([]));
    return this;
  }

  /** Holds actions for `ticks` ticks (pressed on the first), then releases them for one tick. */
  hold(actions: readonly Action[], ticks: number): this {
    for (let i = 0; i < ticks; i++) this.step(frameOf(actions, i === 0 ? actions : []));
    return this.step(frameOf([], [], actions));
  }

  press(actions: readonly Action[]): this {
    return this.hold(actions, 1);
  }

  until(pred: (sim: Sim) => boolean, maxTicks: number, frame: InputFrame = frameOf([])): this {
    for (let i = 0; i < maxTicks; i++) {
      if (pred(this.sim)) return this;
      this.step(frame);
    }
    if (pred(this.sim)) return this;
    throw new Error(`condition not met within ${maxTicks} ticks`);
  }

  count(t: SimEvent['t']): number {
    return this.events.filter((e) => e.t === t).length;
  }
}
