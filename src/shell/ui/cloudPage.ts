import { wasPressed, type InputFrame } from '@core/input/actions';
import type { CloudStatus } from '@shell/platform/cloud/cloudSaves';

/**
 * The title screen's cloud saves page: connect Dropbox or Google Drive; once connected, sync or disconnect;
 * when the service wants a new sign-in, connect it again or disconnect.
 */

export type CloudRow = 'dropbox' | 'google' | 'sync' | 'reconnect' | 'disconnect' | 'back';

export interface CloudPageState {
  readonly cursor: number;
}

export interface CloudStep {
  readonly state: CloudPageState;
  /** `back` also comes from Esc. */
  readonly action: CloudRow | null;
  readonly moved: boolean;
}

export function openCloudPage(): CloudPageState {
  return { cursor: 0 };
}

export function cloudRows(status: CloudStatus): CloudRow[] {
  switch (status) {
    case 'off':
      return ['dropbox', 'google', 'back'];
    case 'on':
      return ['sync', 'disconnect', 'back'];
    case 'reconnect':
      return ['reconnect', 'disconnect', 'back'];
  }
}

export function stepCloudPage(state: CloudPageState, frame: InputFrame, status: CloudStatus): CloudStep {
  const rows = cloudRows(status);
  const cursor = Math.min(state.cursor, rows.length - 1);
  if (wasPressed(frame, 'cancel')) return { state: { cursor }, action: 'back', moved: true };
  if (wasPressed(frame, 'up') || wasPressed(frame, 'down')) {
    const next = (cursor + (wasPressed(frame, 'down') ? 1 : rows.length - 1)) % rows.length;
    return { state: { cursor: next }, action: null, moved: true };
  }
  if (wasPressed(frame, 'confirm') || wasPressed(frame, 'interact')) {
    return { state: { cursor }, action: rows[cursor] ?? 'back', moved: true };
  }
  return { state: { cursor }, action: null, moved: false };
}
