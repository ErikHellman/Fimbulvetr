import type { Bindings } from '@content/bindings';
import { ACTIONS, bit, type InputLatch } from '@core/input/actions';
import type { PadSnapshot } from './gamepad';

export interface MapperOptions {
  readonly holdToggleShield: boolean;
}

/** Turns raw device state into action bits for the latch. Accessibility transforms live here, not in the core. */
export class InputMapper {
  private shieldOn = false;
  private shieldWasDown = false;

  constructor(
    private readonly bindings: Bindings,
    private readonly latch: InputLatch,
    private readonly options: MapperOptions,
  ) {}

  sample(keys: ReadonlySet<string>, pad: PadSnapshot | null): void {
    let held = 0;
    for (const action of ACTIONS) {
      const onKey = this.bindings.kb[action].some((code) => keys.has(code));
      const onPad = pad !== null && this.bindings.pad[action].some((b) => pad.buttons.has(b));
      if (onKey || onPad) held |= bit(action);
    }
    held = this.shieldToggle(held);
    let mx = pad?.ax ?? 0;
    let my = pad?.ay ?? 0;
    if (mx === 0 && my === 0) {
      mx = ((held & bit('right')) !== 0 ? 1 : 0) - ((held & bit('left')) !== 0 ? 1 : 0);
      my = ((held & bit('down')) !== 0 ? 1 : 0) - ((held & bit('up')) !== 0 ? 1 : 0);
    }
    this.latch.report(held, mx, my);
  }

  private shieldToggle(held: number): number {
    if (!this.options.holdToggleShield) return held;
    const shield = bit('shield');
    const down = (held & shield) !== 0;
    if (down && !this.shieldWasDown) this.shieldOn = !this.shieldOn;
    this.shieldWasDown = down;
    return this.shieldOn ? held | shield : held & ~shield;
  }
}
