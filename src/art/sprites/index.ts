import type { AnimTable } from '../anims';
import { CAVE_ANIMS, caveFrames } from './cave';
import { DECOR_ANIMS, decorFrames } from './decor';
import { DUMMY_ANIMS, dummyFrames } from './dummy';
import { ENEMY_ANIMS, enemyFrames } from './enemies';
import { FARM_ANIMS, farmFrames } from './farm';
import { FIXTURE_ANIMS, fixtureFrames } from './fixtures';
import { FX_ANIMS, fxFrames } from './fx';
import { HERO_ANIMS, heroFrames } from './hero';
import { missingFrame } from './missing';
import { MYRLAND_ANIMS, myrlandFrames } from './myrland';
import { PEOPLE_ANIMS, peopleFrames } from './people';
import { SOKKVA_ANIMS, sokkvaFrames } from './sokkva';
import type { SpriteFrame } from './types';
import { UI_ANIMS, uiFrames } from './ui';
import { HAUGAR_ANIMS, haugarFrames } from './haugar';
import { PASS_ANIMS, passFrames } from './pass';
import { NIFLMYRR_ANIMS, niflmyrrFrames } from './niflmyrr';
import { HELGRIND_ANIMS, helgrindFrames } from './helgrind';
import { SAEVATN_ANIMS, saevatnFrames } from './saevatn';

export type { SpriteFrame } from './types';

export const ANIMS: AnimTable = {
  hero: HERO_ANIMS,
  hero_axe: HERO_ANIMS,
  hero_fork: HERO_ANIMS,
  prop_dummy: DUMMY_ANIMS,
  ...PEOPLE_ANIMS,
  ...FARM_ANIMS,
  ...DECOR_ANIMS,
  ...FX_ANIMS,
  ...UI_ANIMS,
  ...ENEMY_ANIMS,
  ...FIXTURE_ANIMS,
  ...CAVE_ANIMS,
  ...MYRLAND_ANIMS,
  ...SOKKVA_ANIMS,
  ...HAUGAR_ANIMS,
  ...PASS_ANIMS,
  ...NIFLMYRR_ANIMS,
  ...HELGRIND_ANIMS,
  ...SAEVATN_ANIMS,
};

export function buildSprites(): SpriteFrame[] {
  return [
    ...heroFrames(),
    ...dummyFrames(),
    ...peopleFrames(),
    ...farmFrames(),
    ...decorFrames(),
    ...fxFrames(),
    ...uiFrames(),
    ...enemyFrames(),
    ...fixtureFrames(),
    ...caveFrames(),
    ...myrlandFrames(),
    ...sokkvaFrames(),
    ...haugarFrames(),
    ...passFrames(),
    ...niflmyrrFrames(),
    ...helgrindFrames(),
    ...saevatnFrames(),
    missingFrame(),
  ];
}
