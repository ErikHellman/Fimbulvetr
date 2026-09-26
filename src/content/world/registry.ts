import type { ScreenDef } from '@core/world/screen';
import type { ScreenId } from './screens';
import { testA } from './testlands/test_a';
import { testB } from './testlands/test_b';
import { testC } from './testlands/test_c';

export const SCREENS: Readonly<Record<ScreenId, ScreenDef>> = {
  test_a: testA,
  test_b: testB,
  test_c: testC,
};
