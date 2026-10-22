import { wasPressed, type Action, type InputFrame } from '@core/input/actions';
import { FONT_SIZES } from '@art/font';
import { LANGS } from '@core/i18n/t';
import { DEFAULT_SETTINGS, type Settings } from '@shell/platform/settings';
import { REMAPPABLE, rebind, type RemappableAction } from '@shell/input/remap';
import { TOUCH_SIZES } from '@shell/input/touchLayout';
import { TOUCH_MODES } from '@shell/platform/settings';

/**
 * The settings menu: pure state and input handling, drawn by the UI and title scenes. It edits a copy of
 * the settings; the caller stores and applies them whenever `changed` is true.
 */

export const SETTING_ROWS = [
  'lang',
  'volume',
  'music',
  'scaling',
  'fullscreen',
  'textSize',
  'shake',
  'flash',
  'holdShield',
  'longDay',
  'colourBlind',
  'showIntro',
  'controls',
  'touch',
  'back',
] as const;
export type SettingRow = (typeof SETTING_ROWS)[number];

/** The controls page: one row per remappable action, then "reset to defaults" and "back". */
export const CONTROL_ROWS = [...REMAPPABLE, 'reset', 'back'] as const;
export type ControlRow = (typeof CONTROL_ROWS)[number];

/** The touch page: when the on-screen controls show, their size and hand, vibration, and moving them. */
export const TOUCH_ROWS = ['touch', 'touchSize', 'touchLeft', 'haptics', 'arrange', 'back'] as const;
export type TouchRow = (typeof TOUCH_ROWS)[number];

export interface SettingsMenuState {
  readonly page: 'main' | 'controls' | 'touch';
  readonly cursor: number;
  /** Waiting for the key to bind to this action (Escape cancels). */
  readonly listening: RemappableAction | null;
}

export interface SettingsStep {
  /** Null: the menu closed (back to whatever opened it). */
  readonly state: SettingsMenuState | null;
  readonly settings: Settings;
  readonly changed: boolean;
  /** The cursor moved or a value changed (the caller plays a tick). */
  readonly moved: boolean;
  /** The full screen row was pressed: the caller toggles it (full screen is the browser's, not a setting). */
  readonly fullscreen: boolean;
  /** "Move the buttons" was picked: the caller opens the layout editor over the menu. */
  readonly arrange: boolean;
}

export function openSettings(): SettingsMenuState {
  return { page: 'main', cursor: 0, listening: null };
}

const any = (frame: InputFrame, actions: readonly Action[]): boolean =>
  actions.some((a) => wasPressed(frame, a));

const VOLUME_STEP = 0.1;
/** Keys that cancel listening instead of being bound. */
const CANCEL_CODES = new Set(['Escape']);

function nudge(s: Settings, row: SettingRow, dir: 1 | -1): Settings {
  switch (row) {
    case 'lang': {
      const i = LANGS.indexOf(s.lang);
      return { ...s, lang: LANGS[(i + (dir === 1 ? 1 : LANGS.length - 1)) % LANGS.length] ?? s.lang };
    }
    case 'volume':
    case 'music':
      return { ...s, [row]: Math.round(Math.min(1, Math.max(0, s[row] + dir * VOLUME_STEP)) * 10) / 10 };
    case 'scaling':
      return { ...s, scaling: s.scaling === 'integer' ? 'fit' : 'integer' };
    case 'textSize': {
      const i = FONT_SIZES.indexOf(s.textSize);
      const n = FONT_SIZES.length;
      return { ...s, textSize: FONT_SIZES[(i + (dir === 1 ? 1 : n - 1)) % n] ?? s.textSize };
    }
    case 'shake':
    case 'flash':
    case 'holdShield':
    case 'longDay':
    case 'colourBlind':
    case 'showIntro':
      return { ...s, [row]: !s[row] };
    case 'fullscreen':
    case 'controls':
    case 'touch':
    case 'back':
      return s;
  }
}

const cycle = <T>(list: readonly T[], v: T, dir: 1 | -1): T =>
  list[(list.indexOf(v) + (dir === 1 ? 1 : list.length - 1)) % list.length] ?? v;

function nudgeTouch(s: Settings, row: TouchRow, dir: 1 | -1): Settings {
  switch (row) {
    case 'touch':
      return { ...s, touch: cycle(TOUCH_MODES, s.touch, dir) };
    case 'touchSize':
      return { ...s, touchSize: cycle(TOUCH_SIZES, s.touchSize, dir) };
    case 'touchLeft':
    case 'haptics':
      return { ...s, [row]: !s[row] };
    case 'arrange':
    case 'back':
      return s;
  }
}

/**
 * One frame of settings input. `code` is a keyboard key pressed this frame (KeyboardEvent.code), used
 * only while listening for a new binding.
 */
export function stepSettings(
  state: SettingsMenuState,
  frame: InputFrame,
  settings: Settings,
  code: string | null,
): SettingsStep {
  const same = { state, settings, changed: false, moved: false, fullscreen: false, arrange: false };
  if (state.listening !== null) {
    if (code === null) return same;
    const listening = null;
    if (CANCEL_CODES.has(code)) return { ...same, state: { ...state, listening }, moved: true };
    const keys = rebind(settings.keys, state.listening, code);
    return {
      ...same,
      state: { ...state, listening },
      settings: { ...settings, keys },
      changed: true,
      moved: true,
    };
  }
  const rows = (state.page === 'main' ? SETTING_ROWS : state.page === 'touch' ? TOUCH_ROWS : CONTROL_ROWS)
    .length;
  if (any(frame, ['up', 'down'])) {
    const cursor = (state.cursor + (wasPressed(frame, 'down') ? 1 : rows - 1)) % rows;
    return { ...same, state: { ...state, cursor }, moved: true };
  }
  if (state.page === 'controls') return stepControls(state, frame, settings);
  if (state.page === 'touch') return stepTouch(state, frame, settings);
  if (any(frame, ['cancel'])) return { ...same, state: null };
  const row = SETTING_ROWS[state.cursor] ?? 'back';
  const confirm = any(frame, ['confirm', 'interact']);
  if (row === 'back' && confirm) return { ...same, state: null };
  if (row === 'controls' && confirm)
    return { ...same, state: { page: 'controls', cursor: 0, listening: null }, moved: true };
  if (row === 'touch' && confirm)
    return { ...same, state: { page: 'touch', cursor: 0, listening: null }, moved: true };
  const dir = wasPressed(frame, 'left') ? -1 : wasPressed(frame, 'right') || confirm ? 1 : 0;
  if (dir === 0 || row === 'controls' || row === 'touch' || row === 'back') return same;
  if (row === 'fullscreen') return { ...same, moved: true, fullscreen: true };
  const next = nudge(settings, row, dir);
  return { ...same, settings: next, changed: true, moved: true };
}

function stepControls(state: SettingsMenuState, frame: InputFrame, settings: Settings): SettingsStep {
  const same = { state, settings, changed: false, moved: false, fullscreen: false, arrange: false };
  const back = {
    ...same,
    state: { page: 'main', cursor: SETTING_ROWS.indexOf('controls'), listening: null } as const,
    moved: true,
  };
  if (any(frame, ['cancel'])) return back;
  if (!any(frame, ['confirm', 'interact'])) return same;
  const row = CONTROL_ROWS[state.cursor] ?? 'back';
  if (row === 'back') return back;
  if (row === 'reset')
    return {
      ...same,
      settings: { ...settings, keys: { ...DEFAULT_SETTINGS.keys } },
      changed: true,
      moved: true,
    };
  return { ...same, state: { ...state, listening: row }, moved: true };
}

function stepTouch(state: SettingsMenuState, frame: InputFrame, settings: Settings): SettingsStep {
  const same = { state, settings, changed: false, moved: false, fullscreen: false, arrange: false };
  const back = {
    ...same,
    state: { page: 'main', cursor: SETTING_ROWS.indexOf('touch'), listening: null } as const,
    moved: true,
  };
  if (any(frame, ['cancel'])) return back;
  const row = TOUCH_ROWS[state.cursor] ?? 'back';
  const confirm = any(frame, ['confirm', 'interact']);
  if (row === 'back') return confirm ? back : same;
  if (row === 'arrange') return confirm ? { ...same, moved: true, arrange: true } : same;
  const dir = wasPressed(frame, 'left') ? -1 : wasPressed(frame, 'right') || confirm ? 1 : 0;
  if (dir === 0) return same;
  return { ...same, settings: nudgeTouch(settings, row, dir), changed: true, moved: true };
}
