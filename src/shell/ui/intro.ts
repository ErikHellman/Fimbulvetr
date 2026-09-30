import { wasPressed, type Action, type InputFrame } from '@core/input/actions';

/**
 * The introduction before a new game: pure state and input handling, drawn by the Title scene. It lists
 * the basic controls, with a "don't show this again" box and Begin. The caller stores the box's choice in
 * the settings, so it holds for every later new game in this browser.
 */

export const INTRO_ROWS = ['dontShow', 'begin'] as const;
export type IntroRow = (typeof INTRO_ROWS)[number];

export interface IntroState {
  readonly cursor: number;
  /** The "don't show this again" box is ticked. */
  readonly dontShow: boolean;
}

export type IntroAction = { readonly k: 'begin'; readonly dontShow: boolean } | { readonly k: 'back' };

export interface IntroStep {
  readonly state: IntroState;
  readonly action: IntroAction | null;
  /** The cursor moved or the box changed (the caller plays a tick). */
  readonly moved: boolean;
}

/** The cursor starts on Begin, so one Enter goes straight into the game. */
export function openIntro(): IntroState {
  return { cursor: INTRO_ROWS.indexOf('begin'), dontShow: false };
}

const any = (frame: InputFrame, actions: readonly Action[]): boolean =>
  actions.some((a) => wasPressed(frame, a));

export function stepIntro(state: IntroState, frame: InputFrame): IntroStep {
  const same: IntroStep = { state, action: null, moved: false };
  if (wasPressed(frame, 'cancel')) return { state, action: { k: 'back' }, moved: true };
  const rows = INTRO_ROWS.length;
  if (any(frame, ['up', 'down'])) {
    const cursor = (state.cursor + (wasPressed(frame, 'down') ? 1 : rows - 1)) % rows;
    return { ...same, state: { ...state, cursor }, moved: true };
  }
  const confirm = any(frame, ['confirm', 'interact']);
  const row = INTRO_ROWS[state.cursor] ?? 'begin';
  if (row === 'begin')
    return confirm ? { state, action: { k: 'begin', dontShow: state.dontShow }, moved: true } : same;
  if (confirm || any(frame, ['left', 'right']))
    return { ...same, state: { ...state, dontShow: !state.dontShow }, moved: true };
  return same;
}
