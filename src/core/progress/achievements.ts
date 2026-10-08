import type { AchievementId } from '@content/ids';
import type { L10n } from '../i18n/t';
import { evalCond, type Cond, type CondCtx } from '../story/cond';

/** A feat the player can earn: a condition over a save. Earned ones are kept by the browser, not the save. */
export interface AchievementDef {
  readonly id: AchievementId;
  readonly name: L10n;
  /** What to do, shown on the list before and after it is earned. */
  readonly hint: L10n;
  readonly when: Cond;
}

/** The achievements whose condition holds now, in definition order. */
export function earned(defs: readonly AchievementDef[], ctx: CondCtx): AchievementId[] {
  return defs.filter((d) => evalCond(d.when, ctx)).map((d) => d.id);
}

/** Earned now and not yet held. */
export function fresh(
  defs: readonly AchievementDef[],
  ctx: CondCtx,
  held: ReadonlySet<string>,
): AchievementId[] {
  return defs.filter((d) => !held.has(d.id) && evalCond(d.when, ctx)).map((d) => d.id);
}
