import { UI } from '@content/i18n/ui';
import { t, type Lang } from '@core/i18n/t';
import type { FullscreenState } from '@shell/platform/fullscreen';
import type { Settings } from '@shell/platform/settings';
import { TOUCH_TEXT } from '@content/i18n/touch';
import { padLabel, prompt, type PromptDevice } from '@shell/input/padLabels';
import { bindingsOf, keyLabel, type RemappableAction } from '@shell/input/remap';
import {
  CONTROL_ROWS,
  SETTING_ROWS,
  TOUCH_ROWS,
  type SettingRow,
  type SettingsMenuState,
  type TouchRow,
} from './settingsMenu';

const LANG_NAME: Readonly<Record<Lang, string>> = { en: 'English', sv: 'Svenska' };

const TEXT_SIZE_NAME = {
  normal: UI.set_text_normal,
  large: UI.set_text_large,
  larger: UI.set_text_larger,
} as const;

const ROW_LABEL = {
  lang: UI.set_lang,
  volume: UI.set_volume,
  music: UI.set_music,
  scaling: UI.set_scaling,
  fullscreen: UI.set_fullscreen,
  textSize: UI.set_text_size,
  shake: UI.set_shake,
  flash: UI.set_flash,
  holdShield: UI.set_hold_shield,
  longDay: UI.set_long_day,
  colourBlind: UI.set_colour_blind,
  showIntro: UI.set_show_intro,
  controls: UI.set_controls,
  touch: UI.set_touch,
  back: UI.set_back,
} as const;

const TOUCH_LABEL = {
  touch: UI.set_touch_show,
  touchSize: UI.set_touch_size,
  touchLeft: UI.set_touch_left,
  haptics: UI.set_haptics,
  arrange: UI.set_touch_arrange,
  back: UI.set_back,
} as const satisfies Record<TouchRow, unknown>;

const TOUCH_MODE_NAME = { auto: UI.set_touch_auto, on: UI.set_on, off: UI.set_off } as const;
const TOUCH_SIZE_NAME = {
  small: UI.set_touch_small,
  normal: UI.set_touch_normal,
  large: UI.set_touch_large,
} as const;

function touchValue(row: TouchRow, s: Settings, lang: Lang): string {
  switch (row) {
    case 'touch':
      return t(TOUCH_MODE_NAME[s.touch], lang);
    case 'touchSize':
      return t(TOUCH_SIZE_NAME[s.touchSize], lang);
    case 'touchLeft':
    case 'haptics':
      return t(s[row] ? UI.set_on : UI.set_off, lang);
    case 'arrange':
    case 'back':
      return '';
  }
}

export const ACTION_LABEL = {
  up: UI.act_up,
  down: UI.act_down,
  left: UI.act_left,
  right: UI.act_right,
  sword: UI.act_sword,
  item1: UI.act_item1,
  item2: UI.act_item2,
  galdr: UI.act_galdr,
  roll: UI.act_roll,
  shield: UI.act_shield,
  interact: UI.act_interact,
  menu: UI.act_menu,
  map: UI.act_map,
} as const satisfies Record<RemappableAction, unknown>;

function value(row: SettingRow, s: Settings, lang: Lang, fullscreen: FullscreenState): string {
  const onOff = (b: boolean): string => t(b ? UI.set_on : UI.set_off, lang);
  switch (row) {
    case 'lang':
      return LANG_NAME[s.lang];
    case 'volume':
    case 'music':
      return `${String(Math.round(s[row] * 10))}/10`;
    case 'scaling':
      return t(s.scaling === 'integer' ? UI.set_scaling_integer : UI.set_scaling_fit, lang);
    case 'fullscreen':
      return fullscreen === 'unsupported' ? t(UI.set_fullscreen_home, lang) : onOff(fullscreen === 'on');
    case 'textSize':
      return t(TEXT_SIZE_NAME[s.textSize], lang);
    case 'shake':
    case 'flash':
    case 'holdShield':
    case 'longDay':
    case 'colourBlind':
    case 'showIntro':
      return onOff(s[row]);
    case 'controls':
    case 'touch':
    case 'back':
      return '';
  }
}

/**
 * The settings menu as two text columns (labels with a `>` cursor, and values) plus the hint line. With a
 * controller connected (`pad`), the controls page and the hints name its buttons instead of keys. The
 * on-screen controls are not rebound here (they have their own page), so with them the keys stay.
 */
export function settingsLines(
  state: SettingsMenuState,
  s: Settings,
  lang: Lang,
  fullscreen: FullscreenState = 'off',
  pad: PromptDevice | null = null,
): { labels: string[]; values: string[]; hint: string } {
  const mark = (i: number): string => (i === state.cursor ? '>' : ' ');
  if (state.page === 'main')
    return {
      labels: SETTING_ROWS.map((r, i) => `${mark(i)} ${t(ROW_LABEL[r], lang)}`),
      values: SETTING_ROWS.map((r) => value(r, s, lang, fullscreen)),
      hint: prompt(UI.set_hint, UI.set_hint_pad, pad, lang),
    };
  if (state.page === 'touch')
    return {
      labels: TOUCH_ROWS.map((r, i) => `${mark(i)} ${t(TOUCH_LABEL[r], lang)}`),
      values: TOUCH_ROWS.map((r) => touchValue(r, s, lang)),
      hint: prompt(UI.set_hint, UI.set_hint_pad, pad, lang),
    };
  const { kb, pad: buttons } = bindingsOf(s.keys);
  const labels = CONTROL_ROWS.map((r, i) => {
    if (r === 'reset') return `${mark(i)} ${t(UI.set_reset, lang)}`;
    if (r === 'back') return `${mark(i)} ${t(UI.set_back, lang)}`;
    return `${mark(i)} ${t(ACTION_LABEL[r], lang)}`;
  });
  const values = CONTROL_ROWS.map((r) =>
    r === 'reset' || r === 'back'
      ? ''
      : pad === null || pad === 'touch'
        ? [...new Set(kb[r].map(keyLabel))].join(', ')
        : buttons[r].map((b) => padLabel(b, pad, lang)).join(', '),
  );
  const hint =
    state.listening === null
      ? prompt(
          UI.set_controls_hint,
          pad === 'touch' ? TOUCH_TEXT.controls_hint : UI.set_controls_hint_pad,
          pad,
          lang,
        )
      : t(UI.set_listening, lang, { detail: t(ACTION_LABEL[state.listening], lang) });
  return { labels, values, hint };
}
