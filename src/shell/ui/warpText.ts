import { UI } from '@content/i18n/ui';
import { REGION_NAMES } from '@content/regions';
import { t, type Lang } from '@core/i18n/t';
import type { StoryUi } from '@core/sim/systems/story';

export type WarpUi = Extract<NonNullable<StoryUi>, { k: 'warps' }>;

/** The lines of Farvegr's picker: a title, the woken stones by region, "stay", and the cost. */
export function warpLines(ui: WarpUi, cost: number, lang: Lang): string[] {
  const mark = (i: number): string => (i === ui.cursor ? '>' : ' ');
  const rows = ui.rows.map((r, i) => `${mark(i)} ${t(REGION_NAMES[r], lang)}`);
  rows.push(`${mark(ui.rows.length)} ${t(UI.warp_stay, lang)}`);
  const note = ui.rows.length === 0 ? t(UI.warp_none, lang) : t(UI.warp_cost, lang, { detail: String(cost) });
  return [t(UI.warp_title, lang), '', ...rows, '', note];
}
