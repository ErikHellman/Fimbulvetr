import type { ScriptDef } from '@core/story/script';
import { DEMO_SCRIPTS } from '../dev/demo';
import type { ScriptId } from '../ids';
import { PROLOGUE_SCRIPTS } from './prologue';
import { RAID_SCRIPTS } from './raid';

/** Cutscenes and interaction scripts by id. */
export const SCRIPTS_DEFS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  ...DEMO_SCRIPTS,
  ...PROLOGUE_SCRIPTS,
  ...RAID_SCRIPTS,
};
