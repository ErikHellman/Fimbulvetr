import type { QuestId } from '@content/ids';
import type { L10n } from '../i18n/t';
import { questStage, type Cond, type CondCtx } from './cond';

/** A quest log entry. Progress is derived from flags: the stage is the last whose `when` holds. */
export interface QuestDef {
  readonly id: QuestId;
  readonly name: L10n;
  readonly stages: readonly QuestStage[];
}

export interface QuestStage {
  readonly when: Cond;
  /** What the log says at this stage. */
  readonly text: L10n;
}

export interface QuestLine {
  readonly id: QuestId;
  readonly name: L10n;
  readonly text: L10n;
  readonly done: boolean;
}

/** Started quests, in definition order. The last stage of a quest means it is done. */
export function questLog(quests: Readonly<Partial<Record<QuestId, QuestDef>>>, ctx: CondCtx): QuestLine[] {
  const out: QuestLine[] = [];
  for (const q of Object.values(quests)) {
    const stage = questStage(q, ctx);
    const st = q.stages[stage];
    if (st === undefined) continue;
    out.push({ id: q.id, name: q.name, text: st.text, done: stage === q.stages.length - 1 });
  }
  return out;
}
