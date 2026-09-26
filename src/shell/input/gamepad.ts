export interface GamepadLike {
  readonly connected: boolean;
  readonly mapping: string;
  readonly buttons: readonly { readonly pressed: boolean; readonly value: number }[];
  readonly axes: readonly number[];
}

export interface PadSnapshot {
  readonly buttons: ReadonlySet<number>;
  readonly ax: number;
  readonly ay: number;
}

export const DEADZONE = 0.25;

/** Radial dead zone; input outside it is rescaled so movement starts smoothly from zero. */
export function deadzone(x: number, y: number, dz: number = DEADZONE): [number, number] {
  const len = Math.sqrt(x * x + y * y);
  if (len < dz) return [0, 0];
  const k = Math.min(1, (len - dz) / (1 - dz)) / len;
  return [x * k, y * k];
}

/** Reads the first connected pad, preferring one with the standard mapping. */
export function readPad(pads: readonly (GamepadLike | null)[]): PadSnapshot | null {
  const connected = pads.filter((p): p is GamepadLike => p !== null && p.connected);
  const pad = connected.find((p) => p.mapping === 'standard') ?? connected[0];
  if (pad === undefined) return null;
  const buttons = new Set<number>();
  pad.buttons.forEach((b, i) => {
    if (b.pressed || b.value > 0.5) buttons.add(i);
  });
  const [ax, ay] = deadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
  return { buttons, ax, ay };
}
