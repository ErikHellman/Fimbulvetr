import type { ScriptDef } from '@core/story/script';
import { DEMO_SCRIPTS } from '../dev/demo';
import type { ScriptId } from '../ids';
import { PROLOGUE_SCRIPTS } from './prologue';
import { D1_SCRIPTS } from './d1';
import { RAID_SCRIPTS } from './raid';
import { HOF_SCRIPTS } from './hofs';
import { UPPVIK_SCRIPTS } from './uppvik';

/** Cutscenes and interaction scripts by id. */
export const SCRIPTS_DEFS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  ...DEMO_SCRIPTS,
  ...PROLOGUE_SCRIPTS,
  ...RAID_SCRIPTS,
  ...D1_SCRIPTS,
  ...HOF_SCRIPTS,
  ...UPPVIK_SCRIPTS,
};
