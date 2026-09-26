import type { AnimTable } from '../anims';
import { DUMMY_ANIMS, dummyFrames } from './dummy';
import { FARM_ANIMS, farmFrames } from './farm';
import { HERO_ANIMS, heroFrames } from './hero';
import { missingFrame } from './missing';
import { PEOPLE_ANIMS, peopleFrames } from './people';
import type { SpriteFrame } from './types';

export type { SpriteFrame } from './types';

export const ANIMS: AnimTable = {
  hero: HERO_ANIMS,
  prop_dummy: DUMMY_ANIMS,
  ...PEOPLE_ANIMS,
  ...FARM_ANIMS,
};

export function buildSprites(): SpriteFrame[] {
  return [...heroFrames(), ...dummyFrames(), ...peopleFrames(), ...farmFrames(), missingFrame()];
}
