import { DB } from '@content/index';
import { NEW_GAME, TEST_START } from '@content/start';
import { ANIMS } from '@art/sprites';
import type { ScreenId } from '@content/world/screens';
import type { Season } from '@core/clock/types';
import { applyPreset, type DevPreset } from '@core/dev/query';
import { bitsOf, type Action, type InputFrame } from '@core/input/actions';
import type { Dir4 } from '@core/math/dir';
import type { ContentDb } from '@core/sim/db';
import type { SimEvent } from '@core/sim/events';
import { Sim } from '@core/sim/sim';
import { newGame, type NewGameInit } from '@core/state/gameState';
import { tileFeet } from '@core/world/screen';

export interface HarnessOptions {
  readonly screen?: ScreenId;
  readonly tile?: readonly [number, number];
  readonly facing?: Dir4;
  readonly minute?: number;
  readonly season?: Season;
  readonly seed?: number;
  readonly db?: ContentDb;
  /** Starting kit; the M0 test kit by default, or the new-game kit when a `preset` is given. */
  readonly start?: NewGameInit;
  /** A dev preset applied over the starting kit (as `?preset=` does in the browser). */
  readonly preset?: DevPreset;
  /** Rolled weather and spawn tables (off by default, so older tests keep the story-only world). */
  readonly rolled?: boolean;
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
    const state = newGame(o.seed ?? 1, o.start ?? (o.preset === undefined ? TEST_START : NEW_GAME));
    if (o.preset !== undefined) applyPreset(state, o.preset);
    if (o.screen !== undefined) state.hero.screen = o.screen;
    if (o.tile !== undefined) {
      const p = tileFeet({ x: o.tile[0], y: o.tile[1] });
      state.hero.x = p.x;
      state.hero.y = p.y;
    }
    if (o.facing !== undefined) state.hero.facing = o.facing;
    if (o.minute !== undefined) state.clock.minute = o.minute;
    if (o.season !== undefined) state.clock.season = o.season;
    this.sim = new Sim(o.db ?? DB, state, { longDay: false, rolled: o.rolled ?? false });
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

  /** Throws if any entity shows an animation that has no drawn frames. */
  expectAnims(): this {
    for (const e of this.sim.entities) {
      if (ANIMS[e.art]?.[e.anim] === undefined)
        throw new Error(`${e.kind} ${e.def} (${e.art}) has no '${e.anim}' animation`);
    }
    return this;
  }
}
