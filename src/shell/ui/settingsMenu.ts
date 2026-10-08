import { wasPressed, type Action, type InputFrame } from '@core/input/actions';
import { FONT_SIZES } from '@art/font';
import { LANGS } from '@core/i18n/t';
import { DEFAULT_SETTINGS, type Settings } from '@shell/platform/settings';
import { REMAPPABLE, rebind, type RemappableAction } from '@shell/input/remap';

/**
 * The settings menu: pure state and input handling, drawn by the UI and title scenes. It edits a copy of
 * the settings; the caller stores and applies them whenever `changed` is true.
 */

export const SETTING_ROWS = [
  'lang',
  'volume',
  'scaling',
  'textSize',
  'shake',
  'flash',
  'holdShield',
  'longDay',
  'colourBlind',
  'showIntro',
  'controls',
  'back',
] as const;
export type SettingRow = (typeof SETTING_ROWS)[number];

/** The controls page: one row per remappable action, then "reset to defaults" and "back". */
export const CONTROL_ROWS = [...REMAPPABLE, 'reset', 'back'] as const;
export type ControlRow = (typeof CONTROL_ROWS)[number];

export interface SettingsMenuState {
  readonly page: 'main' | 'controls';
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
      return { ...s, volume: Math.round(Math.min(1, Math.max(0, s.volume + dir * VOLUME_STEP)) * 10) / 10 };
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
    case 'controls':
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
  const same = { state, settings, changed: false, moved: false };
  if (state.listening !== null) {
    if (code === null) return same;
    const listening = null;
    if (CANCEL_CODES.has(code)) return { ...same, state: { ...state, listening }, moved: true };
    const keys = rebind(settings.keys, state.listening, code);
    return { state: { ...state, listening }, settings: { ...settings, keys }, changed: true, moved: true };
  }
  const rows = state.page === 'main' ? SETTING_ROWS.length : CONTROL_ROWS.length;
  if (any(frame, ['up', 'down'])) {
    const cursor = (state.cursor + (wasPressed(frame, 'down') ? 1 : rows - 1)) % rows;
    return { ...same, state: { ...state, cursor }, moved: true };
  }
  if (state.page === 'controls') return stepControls(state, frame, settings);
  if (any(frame, ['cancel'])) return { ...same, state: null };
  const row = SETTING_ROWS[state.cursor] ?? 'back';
  const confirm = any(frame, ['confirm', 'interact']);
  if (row === 'back' && confirm) return { ...same, state: null };
  if (row === 'controls' && confirm)
    return { ...same, state: { page: 'controls', cursor: 0, listening: null }, moved: true };
  const dir = wasPressed(frame, 'left') ? -1 : wasPressed(frame, 'right') || confirm ? 1 : 0;
  if (dir === 0 || row === 'controls' || row === 'back') return same;
  const next = nudge(settings, row, dir);
  return { state, settings: next, changed: true, moved: true };
}

function stepControls(state: SettingsMenuState, frame: InputFrame, settings: Settings): SettingsStep {
  const same = { state, settings, changed: false, moved: false };
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
      state,
      settings: { ...settings, keys: { ...DEFAULT_SETTINGS.keys } },
      changed: true,
      moved: true,
    };
  return { ...same, state: { ...state, listening: row }, moved: true };
}
