import type { ScriptDef } from '@core/story/script';
import { DEMO_SCRIPTS } from '../dev/demo';
import type { ScriptId } from '../ids';

/** Cutscenes and interaction scripts by id. */
export const SCRIPTS_DEFS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  ...DEMO_SCRIPTS,
};
