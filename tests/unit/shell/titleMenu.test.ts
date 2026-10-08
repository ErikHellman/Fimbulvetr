import { describe, expect, it } from 'vitest';
import type { Action } from '@core/input/actions';
import type { SlotId } from '@shell/platform/saveStore';
import {
  LOAD_ROWS,
  openTitle,
  stepTitle,
  titleRows,
  type TitleAction,
  type TitleInfo,
  versionLabel,
} from '@shell/ui/titleMenu';
import { frameOf } from '../../sim/harness';

const info = (...filled: SlotId[]): TitleInfo => ({
  filled: {
    auto: filled.includes('auto'),
    auto_prev: filled.includes('auto_prev'),
    s1: filled.includes('s1'),
    s2: filled.includes('s2'),
    s3: filled.includes('s3'),
  },
});

function run(i: TitleInfo, ...inputs: readonly (Action[] | 'any')[]) {
  let state = openTitle();
  const actions: TitleAction[] = [];
  for (const input of inputs) {
    const r =
      input === 'any'
        ? stepTitle(state, frameOf([]), i, true)
        : stepTitle(state, frameOf([], input), i, false);
    state = r.state;
    if (r.action !== null) actions.push(r.action);
  }
  return { state, actions };
}

describe('title menu', () => {
  it('waits for any key first', () => {
    expect(run(info(), ['down']).state.page).toBe('press');
    expect(run(info(), 'any').state).toEqual({ page: 'main', cursor: 0 });
  });

  it('offers Continue and Export only with an autosave, and Load only with something to load', () => {
    expect(titleRows(info())).toEqual(['new', 'import', 'settings', 'achievements']);
    expect(titleRows(info('auto'))).toEqual([
      'continue',
      'new',
      'import',
      'export',
      'settings',
      'achievements',
    ]);
    expect(titleRows(info('auto', 's2'))).toEqual([
      'continue',
      'new',
      'load',
      'import',
      'export',
      'settings',
      'achievements',
    ]);
  });

  it('continues, or starts a new game at once when nothing would be lost', () => {
    expect(run(info('auto'), 'any', ['confirm']).actions).toEqual([{ k: 'continue' }]);
    expect(run(info(), 'any', ['confirm']).actions).toEqual([{ k: 'new' }]);
  });

  it('asks before a new game replaces the autosave', () => {
    const asked = run(info('auto'), 'any', ['down'], ['confirm']);
    expect(asked.state.page).toBe('confirmNew');
    expect(asked.actions).toEqual([]);
    expect(run(info('auto'), 'any', ['down'], ['confirm'], ['confirm']).actions).toEqual([{ k: 'new' }]);
    expect(run(info('auto'), 'any', ['down'], ['confirm'], ['cancel']).state).toEqual({
      page: 'main',
      cursor: 1,
    });
  });

  it('loads a filled slot and ignores empty ones', () => {
    const i = info('auto', 's2');
    const toLoad: (Action[] | 'any')[] = ['any', ['down'], ['down'], ['confirm']];
    expect(run(i, ...toLoad).state.page).toBe('load');
    expect(run(i, ...toLoad, ['confirm']).actions).toEqual([]);
    expect(run(i, ...toLoad, ['down'], ['confirm']).actions).toEqual([{ k: 'load', slot: 's2' }]);
    const back = run(i, ...toLoad, ['up'], ['confirm']);
    expect(LOAD_ROWS[LOAD_ROWS.length - 1]).toBe('back');
    expect(back.state).toEqual({ page: 'main', cursor: 2 });
  });

  it('hands import, export, settings and achievements to the scene', () => {
    const i = info('auto');
    expect(run(i, 'any', ['down'], ['down'], ['confirm']).actions).toEqual([{ k: 'import' }]);
    expect(run(i, 'any', ['down'], ['down'], ['down'], ['confirm']).actions).toEqual([{ k: 'export' }]);
    expect(run(i, 'any', ['up'], ['up'], ['confirm']).actions).toEqual([{ k: 'settings' }]);
    expect(run(i, 'any', ['up'], ['confirm']).actions).toEqual([{ k: 'achievements' }]);
  });
});

describe('the version line', () => {
  it('shows the version, and the build when there is one', () => {
    expect(versionLabel('0.5.0', 'dev')).toBe('v0.5.0');
    expect(versionLabel('0.5.0', 'abc1234')).toBe('v0.5.0 (abc1234)');
  });
});
