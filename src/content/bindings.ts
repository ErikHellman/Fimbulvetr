import type { Action } from '@core/input/actions';

export interface Bindings {
  /** KeyboardEvent.code values (physical keys, layout-independent). */
  readonly kb: Readonly<Record<Action, readonly string[]>>;
  /** Standard-mapping button indices: 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 LT, 7 RT, 8 Select, 9 Start, 12–15 d-pad. */
  readonly pad: Readonly<Record<Action, readonly number[]>>;
}

export const DEFAULT_BINDINGS: Bindings = {
  kb: {
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    sword: ['KeyJ'],
    item1: ['KeyK'],
    item2: ['KeyL'],
    galdr: ['KeyI'],
    roll: ['Space'],
    shield: ['ShiftLeft', 'ShiftRight'],
    interact: ['KeyE'],
    menu: ['Tab'],
    map: ['KeyM'],
    confirm: ['Enter', 'KeyE'],
    cancel: ['Escape', 'Backspace'],
  },
  pad: {
    up: [12],
    down: [13],
    left: [14],
    right: [15],
    sword: [2],
    item1: [1],
    item2: [3],
    galdr: [7],
    roll: [5],
    shield: [4],
    interact: [0],
    menu: [9],
    map: [8],
    confirm: [0],
    cancel: [1],
  },
};
