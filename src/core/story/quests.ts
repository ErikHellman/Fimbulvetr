import type { QuestId } from '@content/ids';
import type { L10n } from '../i18n/t';
import { evalCond, questStage, type Cond, type CondCtx } from './cond';

/** A quest log entry. Progress is derived from flags: the stage is the last whose `when` holds. */
export interface QuestDef {
  readonly id: QuestId;
  readonly name: L10n;
  /** Who sets Ask on the quest (missing for one found, not given), and where they are. */
  readonly giver?: QuestGiver;
  readonly stages: readonly QuestStage[];
  /**
   * A story chapter whose last stage still points onward stays open until this holds (the next chapter
   * has begun), so the log never shows the story finished while there is more to do.
   */
  readonly openUntil?: Cond;
}

export interface QuestGiver {
  readonly who?: L10n;
  readonly place: L10n;
}

export interface QuestStage {
  readonly when: Cond;
  /** What the log says at this stage. */
  readonly text: L10n;
  /** Where this stage's work is, when it is one place. */
  readonly at?: L10n;
}

export interface QuestLine {
  readonly id: QuestId;
  readonly name: L10n;
  readonly text: L10n;
  readonly done: boolean;
  readonly giver?: QuestGiver;
  readonly at?: L10n;
}

/** Started quests, in definition order. The last stage of a quest means it is done, unless `openUntil` says not yet. */
export function questLog(quests: Readonly<Partial<Record<QuestId, QuestDef>>>, ctx: CondCtx): QuestLine[] {
  const out: QuestLine[] = [];
  for (const q of Object.values(quests)) {
    const stage = questStage(q, ctx);
    const st = q.stages[stage];
    if (st === undefined) continue;
    const last = stage === q.stages.length - 1;
    out.push({
      id: q.id,
      name: q.name,
      text: st.text,
      done: last && (q.openUntil === undefined || evalCond(q.openUntil, ctx)),
      ...(q.giver === undefined ? {} : { giver: q.giver }),
      ...(st.at === undefined ? {} : { at: st.at }),
    });
  }
  return out;
}
