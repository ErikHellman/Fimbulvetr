import type { QuestDef } from '@core/story/quests';
import type { QuestId } from './ids';

/** Quest definitions. Stages are derived from flags. */
export const QUEST_DEFS: Readonly<Partial<Record<QuestId, QuestDef>>> = {};
