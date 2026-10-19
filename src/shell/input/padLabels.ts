import { DEFAULT_BINDINGS } from '@content/bindings';
import { PAD_BUTTONS, PAD_TEXT, type PadStyle } from '@content/i18n/pad';
import { TOUCH_BUTTONS } from '@content/i18n/touch';
import { t, type L10n, type Lang } from '@core/i18n/t';
import { ACTIONS, type Action } from '@core/input/actions';
import type { GamepadLike } from './gamepad';

export type { PadStyle } from '@content/i18n/pad';

/** What the prompts name: a kind of controller, or the on-screen controls. Null is the keyboard. */
export type PromptDevice = PadStyle | 'touch';

/** Which button names a pad's `id` calls for: PlayStation or Nintendo when it plainly says so, else Xbox. */
export function padStyleOf(id: string): PadStyle {
  if (/playstation|dualshock|dualsense|sony|054c/i.test(id)) return 'playstation';
  if (/nintendo|switch|joy-?con|057e/i.test(id)) return 'nintendo';
  return 'xbox';
}

/** The style of the pad the game reads (the same one `readPad` picks), or null with no pad connected. */
export function activePadStyle(pads: readonly (GamepadLike | null)[]): PadStyle | null {
  const connected = pads.filter((p): p is GamepadLike => p !== null && p.connected);
  const pad = connected.find((p) => p.mapping === 'standard') ?? connected[0];
  return pad === undefined ? null : padStyleOf(pad.id ?? '');
}

/** A standard-mapping button's name on that kind of pad: 0 → A, Cross or B. */
export function padLabel(button: number, style: PadStyle, lang: Lang): string {
  const name = PAD_BUTTONS[style][button];
  return name === undefined ? t(PAD_TEXT.button, lang, { detail: button }) : t(name, lang);
}

/**
 * Each action's first pad button by name, for `{confirm}`, `{cancel}`… in the controller prompts; for
 * the on-screen controls, each button's name.
 */
export function padVars(style: PromptDevice, lang: Lang): Record<Action, string> {
  const out = {} as Record<Action, string>;
  for (const action of ACTIONS) {
    if (style === 'touch') {
      out[action] = t(TOUCH_BUTTONS[action], lang);
      continue;
    }
    const button = DEFAULT_BINDINGS.pad[action][0];
    out[action] = button === undefined ? '' : padLabel(button, style, lang);
  }
  return out;
}

/**
 * A prompt for the device in hand: the keyboard text, or with a pad connected (or the on-screen controls
 * in use) the controller text with its buttons filled in.
 */
export function prompt(
  keyboard: L10n,
  controller: L10n,
  pad: PromptDevice | null,
  lang: Lang,
  vars: Readonly<Record<string, string | number>> = {},
): string {
  return pad === null ? t(keyboard, lang, vars) : t(controller, lang, { ...padVars(pad, lang), ...vars });
}

/** The device prompts should name: the on-screen controls while they show, else a connected pad's kind. */
export const promptDevice = (touch: boolean, pad: PadStyle | null): PromptDevice | null =>
  touch ? 'touch' : pad;
