import type { GamepadLike } from '@shell/input/gamepad';

/**
 * The native app around the web build, when there is one (the Android TV app in `android/`). It injects
 * `window.FimbulvetrHost`; on the web there is none and every function here is a no-op.
 */
export interface NativeHost {
  readonly platform: 'androidtv';
  /** "buttons,ax,ay": a standard-layout button bit mask and the left stick. */
  pad(): string;
  /** Closes the app (Back on the title screen). */
  exit(): void;
}

interface HostObject {
  platform(): string;
  pad(): string;
  exit(): void;
}

function isHostObject(o: unknown): o is HostObject {
  if (typeof o !== 'object' || o === null) return false;
  const h = o as Record<string, unknown>;
  return typeof h.platform === 'function' && typeof h.pad === 'function' && typeof h.exit === 'function';
}

export function nativeHost(win: { FimbulvetrHost?: unknown } = window as never): NativeHost | null {
  const h = win.FimbulvetrHost;
  if (!isHostObject(h) || h.platform() !== 'androidtv') return null;
  return {
    platform: 'androidtv',
    pad: () => h.pad(),
    exit: () => {
      h.exit();
    },
  };
}

/** Standard layout: 17 buttons (A, B, X, Y, shoulders, triggers, Select, Start, sticks, d-pad, home). */
const BUTTONS = 17;

/** The host's controller as a Gamepad API pad, so the game's bindings and `readPad` apply unchanged. */
export function hostPad(host: Pick<NativeHost, 'pad'>): GamepadLike {
  const [mask = 0, ax = 0, ay = 0] = host
    .pad()
    .split(',')
    .map((v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    });
  const buttons = Array.from({ length: BUTTONS }, (_, i) => {
    const pressed = (mask & (1 << i)) !== 0;
    return { pressed, value: pressed ? 1 : 0 };
  });
  return { connected: true, mapping: 'standard', buttons, axes: [ax, ay] };
}

/** The pads to read: the host's first (it swallows controller events, so browser pads stay idle). */
export function withHostPad(
  host: NativeHost | null,
  pads: readonly (GamepadLike | null)[],
): readonly (GamepadLike | null)[] {
  return host === null ? pads : [hostPad(host), ...pads];
}
