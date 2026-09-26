import { fnv1a, hex8 } from '../math/hash';
import type { GameState } from './gameState';
import { MIGRATIONS, migrate, type Migration } from './migrations';
import { validateGameState } from './validate';

export const SAVE_FORMAT = 'fimbulvetr';
export const SAVE_VERSION = 1;

export interface SaveData {
  readonly format: typeof SAVE_FORMAT;
  readonly v: number;
  readonly build: string;
  readonly savedAt: string;
  readonly state: GameState;
  /** FNV-1a of canonicalJson(state). Detects corruption and edits; it is not security. */
  readonly sum: string;
}

export type SaveErrorCode = 'not-a-save' | 'too-new' | 'invalid';

export interface SaveError {
  readonly code: SaveErrorCode;
  readonly detail: string;
}

export type LoadResult =
  | {
      readonly ok: true;
      readonly state: GameState;
      readonly checksumOk: boolean;
      readonly fromVersion: number;
    }
  | { readonly ok: false; readonly error: SaveError };

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (typeof value === 'object' && value !== null) {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) out[key] = sortKeys(source[key]);
    return out;
  }
  return value;
}

/** JSON with object keys sorted at every level, so equal states always hash equally. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

export function checksum(state: unknown): string {
  return hex8(fnv1a(canonicalJson(state)));
}

export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

/** `savedAt` is passed in because the core never reads the wall clock. */
export function makeSave(state: GameState, build: string, savedAt: string): SaveData {
  const copy = cloneState(state);
  return { format: SAVE_FORMAT, v: SAVE_VERSION, build, savedAt, state: copy, sum: checksum(copy) };
}

const fail = (code: SaveErrorCode, detail: string): LoadResult => ({ ok: false, error: { code, detail } });

export function loadSave(
  raw: unknown,
  knownScreens: ReadonlySet<string>,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
): LoadResult {
  if (typeof raw !== 'object' || raw === null || (raw as Record<string, unknown>)['format'] !== SAVE_FORMAT) {
    return fail('not-a-save', 'missing the fimbulvetr format marker');
  }
  const record = raw as Record<string, unknown>;
  const v = record['v'];
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) return fail('invalid', 'bad version number');
  if (v > SAVE_VERSION) return fail('too-new', `save version ${v} is newer than ${SAVE_VERSION}`);
  const rawState = record['state'];
  if (typeof rawState !== 'object' || rawState === null) {
    return fail('invalid', 'missing game state');
  }
  const checksumOk = typeof record['sum'] === 'string' && record['sum'] === checksum(rawState);
  let state: unknown;
  try {
    state = migrate(rawState, v, SAVE_VERSION, migrations);
  } catch (e) {
    return fail('invalid', `migration failed: ${String(e)}`);
  }
  const errors = validateGameState(state, knownScreens);
  if (errors.length > 0) return fail('invalid', errors.slice(0, 3).join('; '));
  return { ok: true, state: state as GameState, checksumOk, fromVersion: v };
}

export function parseSaveJson(text: string, knownScreens: ReadonlySet<string>): LoadResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail('not-a-save', 'not JSON');
  }
  return loadSave(raw, knownScreens);
}
