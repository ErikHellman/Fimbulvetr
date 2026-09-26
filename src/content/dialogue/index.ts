import type { DialogueDef } from '@core/story/dialogue';
import type { DialogueId } from '../ids';

/** Dialogue graphs by id. Every NPC's graph lives in its own file next to this one. */
export const DIALOGUE: Readonly<Partial<Record<DialogueId, DialogueDef>>> = {};
