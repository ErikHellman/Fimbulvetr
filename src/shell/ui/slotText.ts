import { UI } from '@content/i18n/ui';
import { REGION_NAMES } from '@content/regions';
import type { ScreenId } from '@content/world/screens';
import { t, type Lang } from '@core/i18n/t';
import type { ContentDb } from '@core/sim/db';
import type { SaveSummary, SlotId } from '@shell/platform/saveStore';

const SEASON = {
  summer: UI.season_summer,
  autumn: UI.season_autumn,
  winter: UI.season_winter,
  spring: UI.season_spring,
} as const;

/** Play time as h:mm from sim ticks (60 per second). */
export function playTime(ticks: number): string {
  const minutes = Math.floor(ticks / 3600);
  return `${String(Math.floor(minutes / 60))}:${String(minutes % 60).padStart(2, '0')}`;
}

/** "Slot 2" or "Backup autosave". */
export function slotName(slot: SlotId, lang: Lang): string {
  if (slot === 'auto_prev') return t(UI.slot_backup, lang);
  if (slot === 'auto') return t(UI.title_continue, lang);
  return t(UI.slot_name, lang, { detail: slot.slice(1) });
}

/** The othala rune ("home") marks a finished game. */
const DONE_RUNE = 'ᛟ';

/**
 * One line about a saved game: the day and season, the region, hearts and play time, after the othala
 * rune when the game is finished.
 */
export function summaryLine(s: SaveSummary | null, db: ContentDb, lang: Lang): string {
  if (s === null) return t(UI.slot_empty, lang);
  const screen = db.screens[s.screen as ScreenId] as ContentDb['screens'][ScreenId] | undefined;
  const place = screen === undefined ? '?' : t(REGION_NAMES[screen.region], lang);
  const line = t(UI.slot_summary, lang, {
    day: s.day,
    season: t(SEASON[s.season], lang),
    place,
    hearts: Math.floor(s.hearts),
    time: playTime(s.playTicks),
  });
  return s.done === true ? `${DONE_RUNE} ${line}` : line;
}
