import { length, normalize, type Vec } from '../math/vec';

export const ACTIONS = [
  'up',
  'down',
  'left',
  'right',
  'sword',
  'item1',
  'item2',
  'galdr',
  'roll',
  'shield',
  'interact',
  'menu',
  'map',
  'confirm',
  'cancel',
] as const;
export type Action = (typeof ACTIONS)[number];

const BITS = Object.fromEntries(ACTIONS.map((a, i) => [a, 1 << i])) as Readonly<Record<Action, number>>;

export const bit = (a: Action): number => BITS[a];
export const bitsOf = (actions: Iterable<Action>): number => {
  let bits = 0;
  for (const a of actions) bits |= BITS[a];
  return bits;
};

/** One tick of input. `mx`/`my` are in [-1, 1], quantised so recorded replays are exact. */
export interface InputFrame {
  readonly held: number;
  readonly pressed: number;
  readonly released: number;
  readonly mx: number;
  readonly my: number;
}

export const EMPTY_FRAME: InputFrame = { held: 0, pressed: 0, released: 0, mx: 0, my: 0 };

export const isHeld = (f: InputFrame, a: Action): boolean => (f.held & BITS[a]) !== 0;
export const wasPressed = (f: InputFrame, a: Action): boolean => (f.pressed & BITS[a]) !== 0;
export const wasReleased = (f: InputFrame, a: Action): boolean => (f.released & BITS[a]) !== 0;

export function quantize(v: number): number {
  const clamped = Math.max(-1, Math.min(1, v));
  return Math.round(clamped * 64) / 64;
}

/** Movement intent, clamped to length ≤ 1 (so diagonals are not faster). */
export function moveVector(f: InputFrame): Vec {
  const v = { x: f.mx, y: f.my };
  return length(v) > 1 ? normalize(v) : v;
}

/**
 * Collects device state between sim ticks. `report` may be called any number of times per frame;
 * `consume` is called once per tick. A tap that starts and ends between two ticks is still seen.
 */
export class InputLatch {
  private held = 0;
  private pressed = 0;
  private released = 0;
  private mx = 0;
  private my = 0;

  report(held: number, mx: number, my: number): void {
    this.pressed |= held & ~this.held;
    this.released |= this.held & ~held;
    this.held = held;
    this.mx = mx;
    this.my = my;
  }

  consume(): InputFrame {
    const frame: InputFrame = {
      held: this.held | this.pressed,
      pressed: this.pressed,
      released: this.released,
      mx: quantize(this.mx),
      my: quantize(this.my),
    };
    this.pressed = 0;
    this.released = 0;
    return frame;
  }
}
