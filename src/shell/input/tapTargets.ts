import { bit, type Action } from '@core/input/actions';

/**
 * Tapping the menus. Each frame the scenes register what can be tapped, in game pixels; a tap is turned
 * into a short script of presses (one action per frame, with a released frame between), fed through the
 * same input path as keys. So every menu, the title, the dialogue choices and the shop work by touch
 * without knowing about it.
 */

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export type TapTarget =
  /** A line of a list. The first tap moves the cursor to it; tapping the chosen line takes it. */
  | (Rect & {
      readonly k: 'row';
      readonly row: number;
      readonly cursor: number;
      /** Lines in the list when it wraps round (the cursor then takes the shorter way). */
      readonly of?: number;
      /** Tabs step with ←→, lists with ↑↓. */
      readonly axis?: 'v' | 'h';
      /** False: reaching the row is all a tap does (tabs). */
      readonly take?: boolean;
      /** A value column on the line: tapping its left half presses ←, its right half →. */
      readonly value?: { readonly x: number; readonly w: number };
    })
  /** A plain button: tapping it presses one action (a dialogue box, "tap to begin"). */
  | (Rect & { readonly k: 'press'; readonly action: Action });

const inside = (r: Rect, x: number, y: number): boolean =>
  x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;

/** Each press is held one frame and released the next, so every one is a fresh edge. */
const presses = (actions: readonly Action[]): number[] => actions.flatMap((a) => [bit(a), 0]);

/** The presses a tap at (x, y) on a target makes. */
export function tapScript(target: TapTarget, x: number): number[] {
  if (target.k === 'press') return presses([target.action]);
  let delta = target.row - target.cursor;
  const n = target.of;
  if (n !== undefined && Math.abs(delta) > n / 2) delta -= Math.sign(delta) * n;
  if (delta !== 0) {
    const h = target.axis === 'h';
    const step: Action = delta > 0 ? (h ? 'right' : 'down') : h ? 'left' : 'up';
    return presses(Array.from({ length: Math.abs(delta) }, () => step));
  }
  if (target.take === false) return [];
  const v = target.value;
  if (v !== undefined && x >= v.x) return presses([x < v.x + v.w / 2 ? 'left' : 'right']);
  return presses(['confirm']);
}

/** This frame's tappable targets; the topmost (last added) wins where they overlap. */
export class TapTargets {
  private list: TapTarget[] = [];

  clear(): void {
    this.list = [];
  }

  add(target: TapTarget): void {
    this.list.push(target);
  }

  /** A list of `n` lines starting at (x, y), each `lineH` high and `w` wide. */
  rows(
    x: number,
    y: number,
    w: number,
    lineH: number,
    n: number,
    cursor: number,
    extra: Partial<Pick<Extract<TapTarget, { k: 'row' }>, 'axis' | 'take' | 'value'>> = {},
  ): void {
    for (let row = 0; row < n; row++)
      this.add({ k: 'row', x, y: y + row * lineH, w, h: lineH, row, cursor, of: n, ...extra });
  }

  get size(): number {
    return this.list.length;
  }

  hit(x: number, y: number): TapTarget | null {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const t = this.list[i];
      if (t !== undefined && inside(t, x, y)) return t;
    }
    return null;
  }
}
