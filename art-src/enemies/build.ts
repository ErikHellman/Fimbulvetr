import type { DrawnFrame } from '../lib/sprite';
import { draugrFrames } from './draugr';
import { ALPHA_WOLF, FOREST_TROLL, GREY_WOLF, RAID_TROLL, STONE_TROLL } from './palette';
import { poofFrames } from './poof';
import { ravenFrames } from './raven';
import { troll, trollFrames } from './troll';
import { wolfFrames } from './wolf';

/** The wilds' foes under their placeholder names: the `enemies` atlas. */
export function enemyFrames(): DrawnFrame[] {
  return [
    ...wolfFrames('enemy_vargr', GREY_WOLF, false),
    ...wolfFrames('enemy_vargr_alpha', ALPHA_WOLF, true),
    ...ravenFrames(),
    ...draugrFrames(),
    ...trollFrames('enemy_troll', RAID_TROLL),
    ...trollFrames('enemy_forest_troll', FOREST_TROLL),
    // A troll the sun caught, hunched over its club; one frame, facing the viewer.
    {
      name: 'prop_troll_stone_idle_s_0',
      raster: troll('s', 0, 'down', STONE_TROLL),
      pivot: { x: 0.5, y: 54 / 56 },
    },
    ...poofFrames(),
  ];
}
