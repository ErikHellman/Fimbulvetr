import type { ScriptDef } from '@core/story/script';
import { DEMO_SCRIPTS } from '../dev/demo';
import type { ScriptId } from '../ids';
import { PROLOGUE_SCRIPTS } from './prologue';
import { D1_SCRIPTS } from './d1';
import { RAID_SCRIPTS } from './raid';
import { HOF_SCRIPTS } from './hofs';
import { UPPVIK_SCRIPTS } from './uppvik';
import { DEEPWOOD_SCRIPTS } from './deepwood';
import { MYRLAND_SCRIPTS } from './myrland';
import { D2_SCRIPTS } from './d2';
import { HAUGAR_SCRIPTS } from './haugar';
import { PASS_SCRIPTS } from './pass';
import { LOWLAND_SCRIPTS } from './lowlands';
import { NIFLMYRR_SCRIPTS } from './niflmyrr';
import { HELGRIND_SCRIPTS } from './helgrind';
import { D5_SCRIPTS } from './d5';
import { SAEVATN_SCRIPTS } from './saevatn';
import { DVERGAGROF_SCRIPTS } from './dvergagrof';

/** Cutscenes and interaction scripts by id. */
export const SCRIPTS_DEFS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  ...DEMO_SCRIPTS,
  ...PROLOGUE_SCRIPTS,
  ...RAID_SCRIPTS,
  ...D1_SCRIPTS,
  ...HOF_SCRIPTS,
  ...UPPVIK_SCRIPTS,
  ...DEEPWOOD_SCRIPTS,
  ...MYRLAND_SCRIPTS,
  ...D2_SCRIPTS,
  ...HAUGAR_SCRIPTS,
  ...PASS_SCRIPTS,
  ...LOWLAND_SCRIPTS,
  ...NIFLMYRR_SCRIPTS,
  ...HELGRIND_SCRIPTS,
  ...SAEVATN_SCRIPTS,
  ...D5_SCRIPTS,
  ...DVERGAGROF_SCRIPTS,
};
