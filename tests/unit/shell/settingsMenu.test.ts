import { describe, expect, it } from 'vitest';
import type { Action } from '@core/input/actions';
import { DEFAULT_SETTINGS, type Settings } from '@shell/platform/settings';
import { bindingsOf } from '@shell/input/remap';
import {
  CONTROL_ROWS,
  SETTING_ROWS,
  openSettings,
  stepSettings,
  type SettingsMenuState,
  type SettingsStep,
} from '@shell/ui/settingsMenu';
import { frameOf } from '../../sim/harness';

type Input = Action[] | { code: string };

function run(settings: Settings, ...inputs: Input[]) {
  let state: SettingsMenuState | null = openSettings();
  let s = settings;
  let changes = 0;
  for (const i of inputs) {
    if (state === null) break;
    const r: SettingsStep = Array.isArray(i)
      ? stepSettings(state, frameOf([], i), s, null)
      : stepSettings(state, frameOf([]), s, i.code);
    state = r.state;
    s = r.settings;
    if (r.changed) changes += 1;
  }
  return { state, settings: s, changes };
}

const down = (n: number): Action[][] => Array.from({ length: n }, () => ['down']);
const rowOf = (r: (typeof SETTING_ROWS)[number]): number => SETTING_ROWS.indexOf(r);

describe('settings menu', () => {
  it('toggles the language and steps the volume', () => {
    const r = run(DEFAULT_SETTINGS, ['right'], ['down'], ['left'], ['left']);
    expect(r.settings.lang).toBe('sv');
    expect(r.settings.volume).toBeCloseTo(0.5);
    expect(r.changes).toBe(3);
  });

  it('flips the on/off options with confirm or the arrows', () => {
    const r = run(DEFAULT_SETTINGS, ...down(rowOf('colourBlind')), ['confirm']);
    expect(r.settings.colourBlind).toBe(true);
    const shake = run(DEFAULT_SETTINGS, ...down(rowOf('shake')), ['left']);
    expect(shake.settings.shake).toBe(false);
    const intro = run(DEFAULT_SETTINGS, ...down(rowOf('showIntro')), ['confirm']);
    expect(intro.settings.showIntro).toBe(false);
  });

  it('closes with cancel or on the back row, and wraps the cursor', () => {
    expect(run(DEFAULT_SETTINGS, ['cancel']).state).toBeNull();
    expect(run(DEFAULT_SETTINGS, ['up'], ['confirm']).state).toBeNull();
  });

  it('rebinds a key on the controls page and cancels listening with Escape', () => {
    const toControls = [...down(rowOf('controls')), ['confirm']] as Action[][];
    const sword = CONTROL_ROWS.indexOf('sword');
    const r = run(DEFAULT_SETTINGS, ...toControls, ...down(sword), ['confirm'], { code: 'KeyU' });
    expect(r.state?.page).toBe('controls');
    expect(r.state?.listening).toBeNull();
    expect(bindingsOf(r.settings.keys).kb.sword).toEqual(['KeyU']);
    const esc = run(DEFAULT_SETTINGS, ...toControls, ...down(sword), ['confirm'], { code: 'Escape' });
    expect(esc.settings.keys).toEqual({});
    expect(esc.state?.listening).toBeNull();
  });

  it('resets the keys, and goes back to the main page', () => {
    const custom = { ...DEFAULT_SETTINGS, keys: { sword: ['KeyU'] } };
    const toControls = [...down(rowOf('controls')), ['confirm']] as Action[][];
    const r = run(custom, ...toControls, ...down(CONTROL_ROWS.indexOf('reset')), ['confirm']);
    expect(r.settings.keys).toEqual({});
    const back = run(custom, ...toControls, ['cancel']);
    expect(back.state).toEqual({ page: 'main', cursor: rowOf('controls'), listening: null });
  });
});
