import type { FlagId } from '@content/flags';
import type {
  CoverId,
  CritterId,
  DialogueId,
  EnemyId,
  FishId,
  GaldrId,
  ItemId,
  RegionId,
  NpcId,
  PropId,
  QuestId,
  ScriptId,
  ShopId,
} from '@content/ids';
import type { TerrainId } from '@content/terrain';
import type { ScreenId } from '@content/world/screens';
import type { CritterDef } from '../actors/critters';
import type { EnemyDef } from '../actors/enemies/defs';
import type { NpcDef } from '../actors/npc';
import type { PropDef } from '../actors/prop';
import type { Tuning } from '../actors/tuning';
import type { ClockRules } from '../clock/rules';
import type { WeatherKind } from '../clock/types';
import type { GaldrDef, ItemDef } from '../items/defs';
import type { FlagSpec } from '../state/flags';
import type { Cond } from '../story/cond';
import type { DialogueDef } from '../story/dialogue';
import type { FishDef } from '../story/fishing';
import type { QuestDef } from '../story/quests';
import type { ScriptDef } from '../story/script';
import type { ShopDef } from '../story/shop';
import type { CoverDef } from '../world/cover';
import type { ScreenDef, WorldLayout } from '../world/screen';
import type { SpawnTable } from '../world/spawns';
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
  readonly galdr: Readonly<Record<GaldrId, GaldrDef>>;
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
  readonly shops: Readonly<Partial<Record<ShopId, ShopDef>>>;
  /** Story weather: the first rule whose condition holds sets the weather outdoors (else clear). */
  readonly weather: readonly WeatherRule[];
  /** While this holds the world clock stands still (the raid night never dawns). */
  readonly freezeClock?: Cond;
  /** Rolled enemies per region, on screens that list spawn points (only while `rolled` is on). */
  readonly spawns: Readonly<Partial<Record<RegionId, SpawnTable>>>;
  /** The lowland regions, where foes grow with the runestones lit (see `Tuning.stones`). */
  readonly lowlands: readonly RegionId[];
  /** What bites where Ask fishes. */
  readonly fish: Readonly<Record<FishId, FishDef>>;
}

export interface WeatherRule {
  readonly when: Cond;
  readonly kind: WeatherKind;
}
