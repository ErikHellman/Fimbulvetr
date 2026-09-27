import { DEFAULT_BINDINGS, type Bindings } from '@content/bindings';
import type { Action } from '@core/input/actions';

type Keys = Partial<Record<Action, readonly string[]>>;

/**
 * The actions the settings menu lets the player move to other keys. Confirm and cancel keep their keys
 * (Enter, Escape…), so no remap can ever lock the player out of the menus.
 */
export const REMAPPABLE = [
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
] as const satisfies readonly Action[];
export type RemappableAction = (typeof REMAPPABLE)[number];

const isRemappable = (a: Action): a is RemappableAction => (REMAPPABLE as readonly Action[]).includes(a);

/** The defaults with the player's keyboard overrides laid over them (pads keep their defaults). */
export function bindingsOf(keys: Keys): Bindings {
  return { kb: { ...DEFAULT_BINDINGS.kb, ...keys }, pad: DEFAULT_BINDINGS.pad };
}

/**
 * Binds `code` to `action` in place of its first key, keeping the action's other keys (the arrows stay). The key is taken from any
 * other remappable action that had it; one left with no key at all gets `action`'s old first key (a swap).
 * Returns the new overrides; menu keys are never changed.
 */
export function rebind(keys: Keys, action: Action, code: string): Keys {
  if (!isRemappable(action)) return keys;
  const kb = bindingsOf(keys).kb;
  const old = kb[action];
  const out: Keys = { ...keys, [action]: [code, ...old.slice(1).filter((c) => c !== code)] };
  for (const other of REMAPPABLE) {
    if (other === action || !kb[other].includes(code)) continue;
    const left = kb[other].filter((c) => c !== code);
    const first = old[0];
    out[other] = left.length > 0 ? left : first === undefined ? [] : [first];
  }
  return out;
}

const ARROWS: Readonly<Record<string, string>> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
};

/** A short name for a key code, for the menu: KeyJ → J, Digit3 → 3, ShiftLeft → Shift, ArrowUp → ↑. */
export function keyLabel(code: string): string {
  const arrow = ARROWS[code];
  if (arrow !== undefined) return arrow;
  const m = /^(?:Key|Digit|Numpad)(.+)$/.exec(code);
  if (m?.[1] !== undefined) return m[1];
  return code.replace(/(Left|Right)$/, '');
}
