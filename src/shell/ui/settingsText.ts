import { UI } from '@content/i18n/ui';
import { t, type Lang } from '@core/i18n/t';
import type { FullscreenState } from '@shell/platform/fullscreen';
import type { Settings } from '@shell/platform/settings';
import { padLabel, prompt, type PadStyle } from '@shell/input/padLabels';
import { bindingsOf, keyLabel, type RemappableAction } from '@shell/input/remap';
import { CONTROL_ROWS, SETTING_ROWS, type SettingRow, type SettingsMenuState } from './settingsMenu';

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
  back: UI.set_back,
} as const;

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
    case 'back':
      return '';
  }
}

/**
 * The settings menu as two text columns (labels with a `>` cursor, and values) plus the hint line. With a
 * controller connected (`pad`), the controls page and the hints name its buttons instead of keys.
 */
export function settingsLines(
  state: SettingsMenuState,
  s: Settings,
  lang: Lang,
  fullscreen: FullscreenState = 'off',
  pad: PadStyle | null = null,
): { labels: string[]; values: string[]; hint: string } {
  const mark = (i: number): string => (i === state.cursor ? '>' : ' ');
  if (state.page === 'main')
    return {
      labels: SETTING_ROWS.map((r, i) => `${mark(i)} ${t(ROW_LABEL[r], lang)}`),
      values: SETTING_ROWS.map((r) => value(r, s, lang, fullscreen)),
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
      : pad === null
        ? [...new Set(kb[r].map(keyLabel))].join(', ')
        : buttons[r].map((b) => padLabel(b, pad, lang)).join(', '),
  );
  const hint =
    state.listening === null
      ? prompt(UI.set_controls_hint, UI.set_controls_hint_pad, pad, lang)
      : t(UI.set_listening, lang, { detail: t(ACTION_LABEL[state.listening], lang) });
  return { labels, values, hint };
}
