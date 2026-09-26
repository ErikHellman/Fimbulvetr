import type { ContentDb } from '@core/sim/db';
import { CLOCK_RULES } from './clock';
import { DIALOGUE } from './dialogue';
import { ENEMY_DEFS } from './enemies';
import { FLAGS } from './flags';
import { ITEM_DEFS } from './items';
import { QUEST_DEFS } from './quests';
import { SCRIPTS_DEFS } from './scripts';
import { TERRAIN } from './terrain';
import { TUNING } from './tuning';
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
};
