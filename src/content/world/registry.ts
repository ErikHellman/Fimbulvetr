import { askFarmyard } from './askdalr/ask_farmyard';
import { askPasture } from './askdalr/ask_pasture';
import { askField } from './askdalr/ask_field';
import { askBrook } from './askdalr/ask_brook';
import { askVillage } from './askdalr/ask_village';
import { askHof } from './askdalr/ask_hof';
import { askGate } from './askdalr/ask_gate';
import { askRidge } from './askdalr/ask_ridge';
import { askIntLonghouse } from './askdalr/ask_int_longhouse';
import { askIntTrader } from './askdalr/ask_int_trader';
import { askIntHof } from './askdalr/ask_int_hof';
import { myrRoadS } from './myrkvidr/myr_road_s';
import { myrRoad } from './myrkvidr/myr_road';
import { myrDeep } from './myrkvidr/myr_deep';
import { myrBrook } from './myrkvidr/myr_brook';
import { myrClearing } from './myrkvidr/myr_clearing';
import { myrHollow } from './myrkvidr/myr_hollow';
import { myrPines } from './myrkvidr/myr_pines';
import { myrCharcoal } from './myrkvidr/myr_charcoal';
import { myrRoots } from './myrkvidr/myr_roots';
import { myrIntHut } from './myrkvidr/myr_int_hut';
import { d1R01 } from './rotarhellir/d1_r01';
import { d1R02 } from './rotarhellir/d1_r02';
import { d1R03 } from './rotarhellir/d1_r03';
import { d1R04 } from './rotarhellir/d1_r04';
import { d1R05 } from './rotarhellir/d1_r05';
import { d1R06 } from './rotarhellir/d1_r06';
import { d1R07 } from './rotarhellir/d1_r07';
import { d1R08 } from './rotarhellir/d1_r08';
import { d1R09 } from './rotarhellir/d1_r09';
import { d1R10 } from './rotarhellir/d1_r10';
import { d1R11 } from './rotarhellir/d1_r11';
import { d1R12 } from './rotarhellir/d1_r12';
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
  ask_farmyard: askFarmyard,
  ask_pasture: askPasture,
  ask_field: askField,
  ask_brook: askBrook,
  ask_village: askVillage,
  ask_hof: askHof,
  ask_gate: askGate,
  ask_ridge: askRidge,
  ask_int_longhouse: askIntLonghouse,
  ask_int_trader: askIntTrader,
  ask_int_hof: askIntHof,
  myr_road_s: myrRoadS,
  myr_road: myrRoad,
  myr_deep: myrDeep,
  myr_brook: myrBrook,
  myr_clearing: myrClearing,
  myr_hollow: myrHollow,
  myr_pines: myrPines,
  myr_charcoal: myrCharcoal,
  myr_roots: myrRoots,
  myr_int_hut: myrIntHut,
  d1_r01: d1R01,
  d1_r02: d1R02,
  d1_r03: d1R03,
  d1_r04: d1R04,
  d1_r05: d1R05,
  d1_r06: d1R06,
  d1_r07: d1R07,
  d1_r08: d1R08,
  d1_r09: d1R09,
  d1_r10: d1R10,
  d1_r11: d1R11,
  d1_r12: d1R12,
};
