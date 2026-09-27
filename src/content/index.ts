import type { ContentDb } from '@core/sim/db';
import { CLOCK_RULES } from './clock';
import { COVER_DEFS, COVER_LEGEND } from './cover';
import { CRITTER_DEFS } from './critters';
import { COVERS } from './ids';
import { DIALOGUE } from './dialogue';
import { ENEMY_DEFS } from './enemies';
import { FLAGS } from './flags';
import { ITEM_DEFS } from './items';
import { NPC_DEFS } from './npcs';
import { PROP_DEFS } from './props';
import { QUEST_DEFS } from './quests';
import { SCRIPTS_DEFS } from './scripts';
import { SHOP_DEFS } from './shops';
import { TERRAIN } from './terrain';
import { TUNING } from './tuning';
import { WEATHER_RULES } from './weather';
import { WORLD_LAYOUT } from './world/layout';
import { LEGEND } from './world/legend';
import { SCREENS } from './world/registry';

export const DB: ContentDb = {
  screens: SCREENS,
  layout: WORLD_LAYOUT,
  terrain: TERRAIN,
  legend: LEGEND,
  enemies: ENEMY_DEFS,
  tuning: TUNING,
  clock: CLOCK_RULES,
  flags: FLAGS,
  items: ITEM_DEFS,
  quests: QUEST_DEFS,
  dialogue: DIALOGUE,
  scripts: SCRIPTS_DEFS,
  npcs: NPC_DEFS,
  props: PROP_DEFS,
  critters: CRITTER_DEFS,
  cover: COVER_DEFS,
  coverLegend: COVER_LEGEND,
  coverOrder: COVERS,
  shops: SHOP_DEFS,
  weather: WEATHER_RULES,
};
