import type { Entity } from './entity';

export interface StateDef<S extends string, C> {
  enter?(e: Entity, c: C): void;
  /** Return the next state's name to switch, or undefined to stay. */
  tick(e: Entity, c: C): S | undefined;
  exit?(e: Entity, c: C): void;
}

export type Machine<S extends string, C> = { readonly [K in S]: StateDef<S, C> };

function current<S extends string, C>(m: Machine<S, C>, e: Entity): StateDef<S, C> {
  const def = (m as Readonly<Record<string, StateDef<S, C> | undefined>>)[e.fsm.s];
  if (def === undefined) throw new Error(`${e.def}: unknown state '${e.fsm.s}'`);
  return def;
}

/** Runs one tick. `fsm.t` counts ticks since the state was entered and is 0 on the first tick. */
export function runFsm<S extends string, C>(m: Machine<S, C>, e: Entity, c: C): void {
  const next = current(m, e).tick(e, c);
  e.fsm.t += 1;
  if (next !== undefined && next !== e.fsm.s) changeState(m, e, next, c);
}

export function changeState<S extends string, C>(m: Machine<S, C>, e: Entity, next: S, c: C): void {
  const from = (m as Readonly<Record<string, StateDef<S, C> | undefined>>)[e.fsm.s];
  from?.exit?.(e, c);
  e.fsm = { s: next, t: 0 };
  m[next].enter?.(e, c);
}
