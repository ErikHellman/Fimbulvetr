import type { FlagId } from '@content/flags';
import type {
  CoverId,
  CritterId,
  DialogueId,
  EnemyId,
  ItemId,
  NpcId,
  PropId,
  QuestId,
  ScriptId,
} from '@content/ids';
import type { TerrainId } from '@content/terrain';
import type { ScreenId } from '@content/world/screens';
import type { CritterDef } from '../actors/critters';
import type { EnemyDef } from '../actors/enemies/defs';
import type { NpcDef } from '../actors/npc';
import type { PropDef } from '../actors/prop';
import type { Tuning } from '../actors/tuning';
import type { ClockRules } from '../clock/rules';
import type { ItemDef } from '../items/defs';
import type { FlagSpec } from '../state/flags';
import type { DialogueDef } from '../story/dialogue';
import type { QuestDef } from '../story/quests';
import type { ScriptDef } from '../story/script';
import type { CoverDef } from '../world/cover';
import type { ScreenDef, WorldLayout } from '../world/screen';
import type { TerrainDef } from '../world/terrain';

/** Everything the simulation reads from content. The shell passes `DB`; tests may pass variations. */
export interface ContentDb {
  readonly screens: Readonly<Record<ScreenId, ScreenDef>>;
  readonly layout: WorldLayout;
  readonly terrain: Readonly<Record<TerrainId, TerrainDef>>;
  readonly legend: Readonly<Record<string, TerrainId>>;
  readonly enemies: Readonly<Record<EnemyId, EnemyDef>>;
  readonly tuning: Tuning;
  readonly clock: ClockRules;
  readonly flags: Readonly<Record<FlagId, FlagSpec>>;
  readonly items: Readonly<Record<ItemId, ItemDef>>;
  readonly quests: Readonly<Partial<Record<QuestId, QuestDef>>>;
  readonly dialogue: Readonly<Partial<Record<DialogueId, DialogueDef>>>;
  readonly scripts: Readonly<Partial<Record<ScriptId, ScriptDef>>>;
  readonly npcs: Readonly<Partial<Record<NpcId, NpcDef>>>;
  readonly props: Readonly<Record<PropId, PropDef>>;
  readonly critters: Readonly<Record<CritterId, CritterDef>>;
  readonly cover: Readonly<Record<CoverId, CoverDef>>;
  readonly coverLegend: Readonly<Record<string, CoverId>>;
  /** Cover ids in registry order (a grid stores 1 + index). */
  readonly coverOrder: readonly CoverId[];
}
