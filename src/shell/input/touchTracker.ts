import { bit } from '@core/input/actions';
import { moveStick, startStick, stickAxes, stickBits, type Stick } from './stick';
import { buttonAt, type TouchLayout } from './touchLayout';

/** A touch that moved less than this (CSS px) before lifting is a tap. */
export const TAP_SLOP = 12;

type Finger =
  | { readonly k: 'button'; action: TouchLayout['buttons'][number]['action'] }
  | { readonly k: 'stick'; stick: Stick }
  | { readonly k: 'tap'; readonly x: number; readonly y: number; moved: boolean };

const inZone = (l: TouchLayout, x: number, y: number): boolean => {
  const z = l.stick?.zone;
  return z !== undefined && x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h;
};

/**
 * Which on-screen controls each finger holds, from pointer events in CSS pixels. Pure: the DOM layer
 * feeds it events and reads `held` and `axes` once a frame. A finger that lands on a button holds it and
 * may slide onto another (sword to roll without lifting); one that lands in the stick's zone drives the
 * stick; any other is a tap, reported when it lifts without having moved.
 */
export class TouchTracker {
  private readonly fingers = new Map<number, Finger>();
  /** Buttons pressed since the last `take()`, so a tap quicker than a frame is never lost. */
  private tapped = 0;

  constructor(private layout: TouchLayout) {}

  setLayout(l: TouchLayout): void {
    this.layout = l;
    // Buttons that vanished (a menu opened) let go; a stick with no zone any more stops.
    for (const [id, f] of this.fingers) {
      if (f.k === 'button' && !l.buttons.some((b) => b.action === f.action)) this.fingers.delete(id);
      if (f.k === 'stick' && l.stick === null) this.fingers.delete(id);
    }
  }

  down(id: number, x: number, y: number): void {
    const b = buttonAt(this.layout, x, y);
    if (b !== null) {
      this.fingers.set(id, { k: 'button', action: b.action });
      this.tapped |= bit(b.action);
    } else if (inZone(this.layout, x, y) && !this.hasStick())
      this.fingers.set(id, { k: 'stick', stick: startStick(x, y) });
    else this.fingers.set(id, { k: 'tap', x, y, moved: false });
  }

  move(id: number, x: number, y: number): void {
    const f = this.fingers.get(id);
    if (f === undefined) return;
    if (f.k === 'button') {
      const b = buttonAt(this.layout, x, y);
      if (b !== null && b.action !== f.action) {
        f.action = b.action;
        this.tapped |= bit(b.action);
      }
    } else if (f.k === 'stick') f.stick = moveStick(f.stick, x, y, this.layout.stick?.r ?? 1);
    else if (Math.abs(x - f.x) > TAP_SLOP || Math.abs(y - f.y) > TAP_SLOP) f.moved = true;
  }

  /** The finger lifted; a tap returns where it landed. */
  up(id: number): { x: number; y: number } | null {
    const f = this.fingers.get(id);
    this.fingers.delete(id);
    return f?.k === 'tap' && !f.moved ? { x: f.x, y: f.y } : null;
  }

  /** The browser took the touch (a system gesture): forget it without a tap. */
  cancel(id: number): void {
    this.fingers.delete(id);
  }

  clear(): void {
    this.fingers.clear();
    this.tapped = 0;
  }

  /** The thumb on the stick, for drawing it. */
  stick(): Stick | null {
    for (const f of this.fingers.values()) if (f.k === 'stick') return f.stick;
    return null;
  }

  pressing(action: TouchLayout['buttons'][number]['action']): boolean {
    for (const f of this.fingers.values()) if (f.k === 'button' && f.action === action) return true;
    return false;
  }

  axes(): [number, number] {
    const s = this.stick();
    return s === null ? [0, 0] : stickAxes(s, this.layout.stick?.r ?? 1);
  }

  held(): number {
    let bits = 0;
    for (const f of this.fingers.values()) if (f.k === 'button') bits |= bit(f.action);
    const [ax, ay] = this.axes();
    return bits | stickBits(ax, ay);
  }

  /** What is held now plus any button tapped since the last call; then forgets the taps. */
  take(): number {
    const bits = this.held() | this.tapped;
    this.tapped = 0;
    return bits;
  }

  private hasStick(): boolean {
    return this.stick() !== null;
  }
}
