import { ACHIEVEMENT_DEFS, PIECE_TOTAL, questDone } from '@content/achievements';
import { UI } from '@content/i18n/ui';
import type { AchievementId } from '@content/ids';
import { SIDE_QUESTS } from '@content/quests';
import { t, type Lang } from '@core/i18n/t';
import { evalCond, type CondCtx } from '@core/story/cond';

/** The pause menu's quest-page footer: heart pieces, side quests done and achievements, each of its total. */
export function progressLine(ctx: CondCtx, held: ReadonlySet<AchievementId>, lang: Lang): string {
  return t(UI.progress_line, lang, {
    pieces: ctx.state.world.pieces.length,
    piecesOf: PIECE_TOTAL,
    side: SIDE_QUESTS.filter((id) => evalCond(questDone(id), ctx)).length,
    sideOf: SIDE_QUESTS.length,
    ach: ACHIEVEMENT_DEFS.filter((a) => held.has(a.id)).length,
    achOf: ACHIEVEMENT_DEFS.length,
  });
}
