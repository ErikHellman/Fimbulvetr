import type { ScreenDef } from '@core/world/screen';
import type { ScreenId } from './screens';
import { testA } from './testlands/test_a';
import { testB } from './testlands/test_b';
import { testC } from './testlands/test_c';
import { testInt } from './testlands/test_int';

export const SCREENS: Readonly<Record<ScreenId, ScreenDef>> = {
  test_a: testA,
  test_b: testB,
  test_c: testC,
  test_int: testInt,
};
