import { textWidth } from '@art/font';
import { UI } from '@content/i18n/ui';
import { t, type Lang } from '@core/i18n/t';
import type { Settings } from '@shell/platform/settings';
import { bindingsOf, keyLabel, type RemappableAction } from '@shell/input/remap';
import { INTRO_ROWS, type IntroState } from './intro';
import { ACTION_LABEL } from './settingsText';

/** Where the two columns start on the title screen, and the margin they keep on the right. */
export const INTRO_LEFT = 100;

/** Where the keys column starts, from INTRO_LEFT: past the widest label that has keys beside it. */
export function introColumn(labels: readonly string[], values: readonly string[]): number {
  return Math.max(...labels.map((l, i) => (values[i] === '' ? 0 : textWidth(l)))) + 24;
}

const WALK = ['up', 'left', 'down', 'right'] as const satisfies readonly RemappableAction[];
const SHOWN = ['sword', 'shield', 'roll', 'interact'] as const satisfies readonly RemappableAction[];
const PAGES = ['menu', 'map'] as const satisfies readonly RemappableAction[];

/**
 * The introduction as a heading, two text columns (what, and the player's keys for it) and the hint
 * line. Rows with an empty value are notes or the two choices, drawn across both columns.
 */
export function introLines(
  state: IntroState,
  s: Settings,
  lang: Lang,
): { heading: string; labels: string[]; values: string[]; hint: string } {
  const kb = bindingsOf(s.keys).kb;
  const keys = (a: RemappableAction): string => [...new Set(kb[a].map(keyLabel))].join(', ');
  const nth = (n: number): string =>
    WALK.map((a) => kb[a][n])
      .filter((c): c is string => c !== undefined)
      .map(keyLabel)
      .join(' ');
  const walk = [nth(0), nth(1)].filter((k) => k !== '').join('  ·  ');
  const rows: [string, string][] = [
    [t(UI.intro_walk, lang), walk],
    ...SHOWN.map((a): [string, string] => [t(ACTION_LABEL[a], lang), keys(a)]),
    [t(UI.intro_items, lang), [keys('item1'), keys('item2')].join(', ')],
    ...PAGES.map((a): [string, string] => [t(ACTION_LABEL[a], lang), keys(a)]),
    ['', ''],
    [t(UI.intro_pad, lang), ''],
    [t(UI.intro_saving, lang), ''],
    ['', ''],
  ];
  const mark = (row: (typeof INTRO_ROWS)[number]): string => (INTRO_ROWS[state.cursor] === row ? '> ' : '  ');
  const box = state.dontShow ? '[x]' : '[ ]';
  return {
    heading: t(UI.intro_heading, lang),
    labels: [
      ...rows.map(([label]) => label),
      `${mark('dontShow')}${box} ${t(UI.intro_dont_show, lang)}`,
      `${mark('begin')}${t(UI.intro_begin, lang)}`,
    ],
    values: [...rows.map(([, value]) => value), '', ''],
    hint: t(UI.intro_hint, lang),
  };
}
