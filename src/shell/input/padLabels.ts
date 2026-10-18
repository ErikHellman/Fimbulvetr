import { DEFAULT_BINDINGS } from '@content/bindings';
import { PAD_BUTTONS, PAD_TEXT, type PadStyle } from '@content/i18n/pad';
import { t, type L10n, type Lang } from '@core/i18n/t';
import { ACTIONS, type Action } from '@core/input/actions';
import type { GamepadLike } from './gamepad';

export type { PadStyle } from '@content/i18n/pad';

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

/** Each action's first pad button by name, for `{confirm}`, `{cancel}`… in the controller prompts. */
export function padVars(style: PadStyle, lang: Lang): Record<Action, string> {
  const out = {} as Record<Action, string>;
  for (const action of ACTIONS) {
    const button = DEFAULT_BINDINGS.pad[action][0];
    out[action] = button === undefined ? '' : padLabel(button, style, lang);
  }
  return out;
}

/** A prompt for the device in hand: the keyboard text, or with a pad connected its own text with the buttons filled in. */
export function prompt(
  keyboard: L10n,
  controller: L10n,
  pad: PadStyle | null,
  lang: Lang,
  vars: Readonly<Record<string, string | number>> = {},
): string {
  return pad === null ? t(keyboard, lang, vars) : t(controller, lang, { ...padVars(pad, lang), ...vars });
}
