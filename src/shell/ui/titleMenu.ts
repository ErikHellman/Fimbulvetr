import { wasPressed, type Action, type InputFrame } from '@core/input/actions';
import type { SlotId } from '@shell/platform/saveStore';

/**
 * The title screen: pure state and input handling, drawn by the Title scene. "Press any key" first (that
 * key also unlocks audio), then the main list, the load list and a confirmation before a new game
 * replaces an autosave.
 */

/** The corner line under the demo tag: the version, and the build it came from (none in dev). */
export const versionLabel = (version: string, build: string): string =>
  build === 'dev' ? `v${version}` : `v${version} (${build})`;

export type TitleRow = 'continue' | 'new' | 'load' | 'import' | 'export' | 'settings' | 'achievements';
/** Rows of the load page: the manual slots, the backup autosave, then back. */
export const LOAD_ROWS = ['s1', 's2', 's3', 'auto_prev', 'back'] as const satisfies readonly (
  SlotId | 'back'
)[];

export interface TitleInfo {
  /** Which slots hold a save. */
  readonly filled: Readonly<Record<SlotId, boolean>>;
}

export interface TitleState {
  readonly page: 'press' | 'main' | 'load' | 'confirmNew';
  readonly cursor: number;
}

export type TitleAction =
  | { readonly k: 'continue' }
  | { readonly k: 'new' }
  | { readonly k: 'load'; readonly slot: SlotId }
  | { readonly k: 'import' }
  | { readonly k: 'export' }
  | { readonly k: 'settings' }
  | { readonly k: 'achievements' };

export interface TitleStep {
  readonly state: TitleState;
  readonly action: TitleAction | null;
  /** The cursor moved or a page changed (the caller plays a tick). */
  readonly moved: boolean;
}

export function openTitle(): TitleState {
  return { page: 'press', cursor: 0 };
}

/** The main list: Continue and Export only with an autosave, Load only with another save to load. */
export function titleRows(info: TitleInfo): TitleRow[] {
  const f = info.filled;
  const loadable = f.s1 || f.s2 || f.s3 || f.auto_prev;
  return [
    ...(f.auto ? (['continue'] as const) : []),
    'new',
    ...(loadable ? (['load'] as const) : []),
    'import',
    ...(f.auto ? (['export'] as const) : []),
    'settings',
    'achievements',
  ];
}

const any = (frame: InputFrame, actions: readonly Action[]): boolean =>
  actions.some((a) => wasPressed(frame, a));

/** One frame of title input. `anyKey`: some key or button went down this frame (for "press any key"). */
export function stepTitle(state: TitleState, frame: InputFrame, info: TitleInfo, anyKey: boolean): TitleStep {
  const same: TitleStep = { state, action: null, moved: false };
  const go = (next: TitleState, action: TitleAction | null = null): TitleStep => ({
    state: next,
    action,
    moved: true,
  });
  if (state.page === 'press') return anyKey ? go({ page: 'main', cursor: 0 }) : same;
  const confirm = any(frame, ['confirm', 'interact']);
  if (state.page === 'confirmNew') {
    if (confirm) return go({ page: 'main', cursor: 0 }, { k: 'new' });
    if (any(frame, ['cancel', 'up', 'down']))
      return go({ page: 'main', cursor: titleRows(info).indexOf('new') });
    return same;
  }
  const rows = state.page === 'main' ? titleRows(info).length : LOAD_ROWS.length;
  if (any(frame, ['up', 'down'])) {
    const cursor = (state.cursor + (wasPressed(frame, 'down') ? 1 : rows - 1)) % rows;
    return go({ ...state, cursor });
  }
  if (state.page === 'load') {
    const back = go({ page: 'main', cursor: titleRows(info).indexOf('load') });
    if (wasPressed(frame, 'cancel')) return back;
    if (!confirm) return same;
    const row = LOAD_ROWS[state.cursor] ?? 'back';
    if (row === 'back') return back;
    return info.filled[row] ? go(state, { k: 'load', slot: row }) : same;
  }
  if (!confirm) return same;
  const row = titleRows(info)[state.cursor];
  switch (row) {
    case 'continue':
    case 'import':
    case 'export':
    case 'settings':
    case 'achievements':
      return go(state, { k: row });
    case 'new':
      return info.filled.auto ? go({ page: 'confirmNew', cursor: 0 }) : go(state, { k: 'new' });
    case 'load':
      return go({ page: 'load', cursor: 0 });
    default:
      return same;
  }
}
