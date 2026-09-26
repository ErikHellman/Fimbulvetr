import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS } from '@content/world/screens';
import { newGame } from '@core/state/gameState';
import { migrate } from '@core/state/migrations';
import {
  SAVE_VERSION,
  canonicalJson,
  cloneState,
  loadSave,
  makeSave,
  parseSaveJson,
  type LoadResult,
} from '@core/state/save';

const known = new Set<string>(SCREEN_IDS);
const fixturePath = (v: number): URL => new URL(`../../fixtures/saves/v${v}.json`, import.meta.url);

function expectError(result: LoadResult, code: string): string {
  if (result.ok) throw new Error('expected a failed load');
  expect(result.error.code).toBe(code);
  return result.error.detail;
}

describe('canonicalJson', () => {
  it('sorts keys recursively and keeps arrays in order', () => {
    expect(canonicalJson({ b: 1, a: { d: 1, c: [2, 1] } })).toBe('{"a":{"c":[2,1],"d":1},"b":1}');
  });
});

describe('save round trip', () => {
  it('loads what it saved, with a valid checksum', () => {
    const state = newGame(99, NEW_GAME);
    const result = loadSave(makeSave(state, 'test', '2026-09-26T00:00:00.000Z'), known);
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.state).toEqual(state);
    expect(result.checksumOk).toBe(true);
    expect(result.fromVersion).toBe(SAVE_VERSION);
  });

  it('copies the state so later changes do not leak into the save', () => {
    const state = newGame(1, NEW_GAME);
    const save = makeSave(state, 'test', 'x');
    state.hero.hp = 1;
    expect(save.state.hero.hp).toBe(12);
    expect(cloneState(state)).toEqual(state);
  });

  it('still loads an edited save but reports the checksum mismatch', () => {
    const save = makeSave(newGame(1, NEW_GAME), 'test', 'x');
    const edited = { ...save, state: { ...save.state, hero: { ...save.state.hero, hp: 4 } } };
    const result = loadSave(edited, known);
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(false);
  });
});

describe('rejecting bad input', () => {
  it('rejects things that are not saves', () => {
    expectError(loadSave(null, known), 'not-a-save');
    expectError(loadSave({}, known), 'not-a-save');
    expectError(loadSave({ format: 'zelda', v: 1 }, known), 'not-a-save');
    expectError(parseSaveJson('this is not json', known), 'not-a-save');
  });

  it('rejects saves from a newer version', () => {
    const save = makeSave(newGame(1, NEW_GAME), 'test', 'x');
    expectError(loadSave({ ...save, v: SAVE_VERSION + 1 }, known), 'too-new');
  });

  it('rejects invalid values with a path in the detail', () => {
    const save = makeSave(newGame(1, NEW_GAME), 'test', 'x');
    const bad = { ...save, state: { ...save.state, hero: { ...save.state.hero, hp: -1 } } };
    expect(expectError(loadSave(bad, known), 'invalid')).toContain('state.hero.hp');
  });

  it('rejects an unknown hero screen', () => {
    const save = makeSave(newGame(1, NEW_GAME), 'test', 'x');
    const bad = { ...save, state: { ...save.state, hero: { ...save.state.hero, screen: 'nowhere' } } };
    expect(expectError(loadSave(bad, known), 'invalid')).toContain('unknown screen');
  });
});

describe('migrations', () => {
  it('applies steps in order', () => {
    const steps = {
      1: (s: unknown) => ({ ...(s as object), b: 2 }),
      2: (s: unknown) => ({ ...(s as object), c: 3 }),
    };
    expect(migrate({ a: 1 }, 1, 3, steps)).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('throws when a step is missing', () => {
    expect(() => migrate({}, 1, 3, { 1: (s: unknown) => s })).toThrow('no migration from v2');
  });
});

describe('fixtures', () => {
  it('has a fixture for the current SAVE_VERSION', () => {
    expect(existsSync(fixturePath(SAVE_VERSION))).toBe(true);
  });

  it('loads every committed fixture', () => {
    for (let v = 1; v <= SAVE_VERSION; v++) {
      const result = parseSaveJson(readFileSync(fixturePath(v), 'utf8'), known);
      if (!result.ok) throw new Error(`v${v}: ${result.error.detail}`);
      expect(result.checksumOk).toBe(true);
    }
  });
});
