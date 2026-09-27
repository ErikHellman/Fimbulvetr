import { wasPressed, type InputFrame } from '@core/input/actions';

/**
 * The save-slot picker a mead hall or hof opens (the sim's `save` script step): three slots and "leave".
 * Pure state and input; the scene writes the slot and answers the sim with `saved`.
 */

export const PICK_ROWS = ['s1', 's2', 's3', 'leave'] as const;
export type PickRow = (typeof PICK_ROWS)[number];

export interface PickerState {
  readonly cursor: number;
  /** `pick`: choosing; `writing`: waiting for storage; `done`: showing the result until a key or timeout. */
  readonly phase: 'pick' | 'writing' | 'done';
  /** Frames in the current phase (while picking: since it opened; when done: showing the result). */
  readonly t: number;
}

/**
 * Frames the picker ignores after opening: the key that closed the text before it must not also pick
 * the first slot.
 */
export const ARM_FRAMES = 8;

export type PickerAction =
  { readonly k: 'write'; readonly slot: 's1' | 's2' | 's3' } | { readonly k: 'close' };

/** How long "Saved in slot N." stays up, in frames, before the picker closes by itself. */
export const DONE_FRAMES = 75;

export function openPicker(): PickerState {
  return { cursor: 0, phase: 'pick', t: 0 };
}

export function stepPicker(
  state: PickerState,
  frame: InputFrame,
): { state: PickerState; action: PickerAction | null; moved: boolean } {
  const confirm = wasPressed(frame, 'confirm') || wasPressed(frame, 'interact');
  if (state.phase === 'writing') return { state, action: null, moved: false };
  if (state.phase === 'pick' && state.t < ARM_FRAMES)
    return { state: { ...state, t: state.t + 1 }, action: null, moved: false };
  if (state.phase === 'done') {
    const t = state.t + 1;
    if (confirm || wasPressed(frame, 'cancel') || t >= DONE_FRAMES)
      return { state: { ...state, t }, action: { k: 'close' }, moved: false };
    return { state: { ...state, t }, action: null, moved: false };
  }
  if (wasPressed(frame, 'cancel')) return { state, action: { k: 'close' }, moved: true };
  const n = PICK_ROWS.length;
  if (wasPressed(frame, 'up') || wasPressed(frame, 'down')) {
    const cursor = (state.cursor + (wasPressed(frame, 'down') ? 1 : n - 1)) % n;
    return { state: { ...state, cursor }, action: null, moved: true };
  }
  if (!confirm) return { state, action: null, moved: false };
  const row = PICK_ROWS[state.cursor] ?? 'leave';
  if (row === 'leave') return { state, action: { k: 'close' }, moved: true };
  return { state: { ...state, phase: 'writing' }, action: { k: 'write', slot: row }, moved: true };
}

/** Storage answered: show the result. */
export function pickerDone(state: PickerState): PickerState {
  return { ...state, phase: 'done', t: 0 };
}
