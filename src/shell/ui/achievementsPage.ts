import { ACHIEVEMENT_DEFS } from '@content/achievements';
import { UI } from '@content/i18n/ui';
import type { AchievementId } from '@content/ids';
import { wasPressed, type InputFrame } from '@core/input/actions';
import { t, type Lang } from '@core/i18n/t';

/**
 * The title screen's achievements page: every achievement in two columns, earned ones marked, and the
 * chosen one's hint underneath. Pure state and input; the Title scene draws it.
 */

/** Rows per column. */
export const ACH_ROWS = 12;

export interface AchievementsPage {
  readonly cursor: number;
}

export interface AchievementsStep {
  /** Null: the page closed. */
  readonly state: AchievementsPage | null;
  readonly moved: boolean;
}

export const openAchievements = (): AchievementsPage => ({ cursor: 0 });

export function stepAchievements(page: AchievementsPage, frame: InputFrame): AchievementsStep {
  const n = ACHIEVEMENT_DEFS.length;
  if (wasPressed(frame, 'cancel') || wasPressed(frame, 'confirm')) return { state: null, moved: true };
  let cursor = page.cursor;
  if (wasPressed(frame, 'down')) cursor = (cursor + 1) % n;
  else if (wasPressed(frame, 'up')) cursor = (cursor + n - 1) % n;
  else if (wasPressed(frame, 'right') || wasPressed(frame, 'left'))
    cursor = Math.min(n - 1, cursor < ACH_ROWS ? cursor + ACH_ROWS : cursor - ACH_ROWS);
  else return { state: page, moved: false };
  return { state: { cursor }, moved: true };
}

export interface AchievementLines {
  readonly heading: string;
  readonly left: readonly string[];
  readonly right: readonly string[];
  /** Per achievement, in definition order: earned (drawn in gold) or not (dim). */
  readonly earned: readonly boolean[];
  readonly hint: string;
}

export function achievementLines(
  page: AchievementsPage,
  held: ReadonlySet<AchievementId>,
  lang: Lang,
): AchievementLines {
  const rows = ACHIEVEMENT_DEFS.map((a, i) => `${i === page.cursor ? '>' : ' '} ${t(a.name, lang)}`);
  const chosen = ACHIEVEMENT_DEFS[page.cursor];
  return {
    heading: t(UI.ach_heading, lang, {
      n: ACHIEVEMENT_DEFS.filter((a) => held.has(a.id)).length,
      of: ACHIEVEMENT_DEFS.length,
    }),
    left: rows.slice(0, ACH_ROWS),
    right: rows.slice(ACH_ROWS),
    earned: ACHIEVEMENT_DEFS.map((a) => held.has(a.id)),
    hint: chosen === undefined ? '' : t(chosen.hint, lang),
  };
}
