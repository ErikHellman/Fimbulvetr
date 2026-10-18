import { describe, expect, it } from 'vitest';
import { textWidth } from '@art/font';
import { UI } from '@content/i18n/ui';
import { PAD_STYLES } from '@content/i18n/pad';
import type { GamepadLike } from '@shell/input/gamepad';
import { activePadStyle, padLabel, padStyleOf, prompt } from '@shell/input/padLabels';
import { DEFAULT_SETTINGS } from '@shell/platform/settings';
import { GAME_W } from '@shell/scale';
import { openIntro } from '@shell/ui/intro';
import { introLines } from '@shell/ui/introText';
import { CONTROL_ROWS } from '@shell/ui/settingsMenu';
import { settingsLines } from '@shell/ui/settingsText';

const pad = (id: string, mapping = 'standard'): GamepadLike => ({
  id,
  mapping,
  connected: true,
  buttons: [],
  axes: [],
});

describe('controller prompts', () => {
  it('tells PlayStation and Nintendo pads from the rest by their id', () => {
    expect(padStyleOf('DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)')).toBe(
      'playstation',
    );
    expect(padStyleOf('054c-09cc-Wireless Controller')).toBe('playstation');
    expect(padStyleOf('Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)')).toBe('nintendo');
    expect(padStyleOf('Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)')).toBe('xbox');
    expect(padStyleOf('8BitDo SN30 Pro')).toBe('xbox');
    expect(padStyleOf('')).toBe('xbox');
  });

  it('reads the style of the pad the game reads, or null with none', () => {
    expect(activePadStyle([])).toBeNull();
    expect(activePadStyle([null, { ...pad('DualShock 4'), connected: false }])).toBeNull();
    expect(activePadStyle([pad('Joy-Con', ''), pad('DualShock 4')])).toBe('playstation');
    expect(activePadStyle([{ ...pad('x'), id: undefined }])).toBe('xbox');
  });

  it('names the face buttons by the pad’s own marks', () => {
    expect(padLabel(0, 'xbox', 'en')).toBe('A');
    expect(padLabel(0, 'playstation', 'en')).toBe('✕');
    expect(padLabel(0, 'nintendo', 'en')).toBe('B');
    expect(padLabel(12, 'xbox', 'sv')).toBe('Styrkors ↑');
    expect(padLabel(16, 'xbox', 'en')).toBe('Button 16');
  });

  it('fills a prompt with buttons only while a pad is connected', () => {
    expect(prompt(UI.set_hint, UI.set_hint_pad, null, 'en')).toBe(UI.set_hint.en);
    expect(prompt(UI.set_hint, UI.set_hint_pad, 'xbox', 'en')).toBe('↑↓: choose   ←→ or A: change   B: back');
    expect(prompt(UI.game_over_continue, UI.game_over_continue_pad, 'playstation', 'sv')).toBe(
      'Res dig igen: ✕',
    );
  });

  it('shows the pad buttons on the controls page and in the introduction', () => {
    const controls = settingsLines(
      { page: 'controls', cursor: 0, listening: null },
      DEFAULT_SETTINGS,
      'en',
      'xbox',
    );
    expect(controls.values[CONTROL_ROWS.indexOf('sword')]).toBe('X');
    expect(controls.values[CONTROL_ROWS.indexOf('up')]).toBe('D-pad ↑');
    expect(controls.hint).toContain('A: pick a new key');
    const keys = settingsLines({ page: 'controls', cursor: 0, listening: null }, DEFAULT_SETTINGS, 'en');
    expect(keys.values[CONTROL_ROWS.indexOf('sword')]).toBe('J');
    const intro = introLines(openIntro(), DEFAULT_SETTINGS, 'en', 'playstation');
    const all = intro.values.join('\n');
    expect(all).toContain('D-pad  ·  left stick');
    expect(all).toContain('□');
    expect(intro.labels).toContain('The keyboard works too.');
    expect(intro.hint).toBe('↑↓: choose   ✕: tick or begin   ○: back');
  });

  it('fits every controller hint on the screen', () => {
    const hints = [
      UI.set_hint_pad,
      UI.set_controls_hint_pad,
      UI.intro_hint_pad,
      UI.title_hint_pad,
      UI.title_load_hint_pad,
      UI.title_confirm_new_pad,
      UI.ach_hint_pad,
      UI.slot_pick_hint_pad,
      UI.menu_tabs_hint_pad,
      UI.menu_items_hint_pad,
      UI.fish_idle_pad,
      UI.fish_reel_pad,
    ];
    for (const style of PAD_STYLES)
      for (const lang of ['en', 'sv'] as const)
        for (const h of hints) {
          const text = prompt(h, h, style, lang);
          expect(text).not.toMatch(/\{\w+\}/);
          expect(textWidth(text), text).toBeLessThan(GAME_W - 16);
        }
  });
});
