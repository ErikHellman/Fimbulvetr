import type { EnemyId } from '@content/ids';
import type { TerrainId } from '@content/terrain';
import type { ScreenId } from '@content/world/screens';
import type { EnemyDef } from '../actors/enemies/defs';
import type { Tuning } from '../actors/tuning';
import type { ClockRules } from '../clock/rules';
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
}
