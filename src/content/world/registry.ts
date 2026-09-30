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
import { myrNorth } from './myrkvidr/myr_north';
import { myrFen } from './myrkvidr/myr_fen';
import { myrIntVolva } from './myrkvidr/myr_int_volva';
import { myrGlade } from './myrkvidr/myr_glade';
import { myrTrollskog } from './myrkvidr/myr_trollskog';
import { uppGate } from './uppvik/upp_gate';
import { uppSquare } from './uppvik/upp_square';
import { uppHall } from './uppvik/upp_hall';
import { uppSmiths } from './uppvik/upp_smiths';
import { uppIntMeadhall } from './uppvik/upp_int_meadhall';
import { uppIntTrader } from './uppvik/upp_int_trader';
import { uppIntSmithy } from './uppvik/upp_int_smithy';
import { uppIntRunehall } from './uppvik/upp_int_runehall';
import { uppIntHof } from './uppvik/upp_int_hof';
import { mylWeir } from './myrland/myl_weir';
import { mylFord } from './myrland/myl_ford';
import { mylRiver } from './myrland/myl_river';
import { mylMill } from './myrland/myl_mill';
import { mylFisher } from './myrland/myl_fisher';
import { mylFerry } from './myrland/myl_ferry';
import { mylSprings } from './myrland/myl_springs';
import { mylPeat } from './myrland/myl_peat';
import { mylBog } from './myrland/myl_bog';
import { mylReeds } from './myrland/myl_reeds';
import { mylIntFisher } from './myrland/myl_int_fisher';
import { mylIntWidow } from './myrland/myl_int_widow';
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
import { d2R01 } from './sokkva/d2_r01';
import { d2R02 } from './sokkva/d2_r02';
import { d2R03 } from './sokkva/d2_r03';
import { d2R04 } from './sokkva/d2_r04';
import { d2R05 } from './sokkva/d2_r05';
import { d2R06 } from './sokkva/d2_r06';
import { d2R07 } from './sokkva/d2_r07';
import { d2R08 } from './sokkva/d2_r08';
import { d2R09 } from './sokkva/d2_r09';
import { d2R10 } from './sokkva/d2_r10';
import { d2R11 } from './sokkva/d2_r11';
import { d2R12 } from './sokkva/d2_r12';
import { d2R13 } from './sokkva/d2_r13';
import { d2R14 } from './sokkva/d2_r14';
import { d2R15 } from './sokkva/d2_r15';
import { d2R16 } from './sokkva/d2_r16';
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
  myr_north: myrNorth,
  myr_fen: myrFen,
  myr_int_volva: myrIntVolva,
  myr_glade: myrGlade,
  myr_trollskog: myrTrollskog,
  upp_gate: uppGate,
  upp_square: uppSquare,
  upp_hall: uppHall,
  upp_smiths: uppSmiths,
  upp_int_meadhall: uppIntMeadhall,
  upp_int_trader: uppIntTrader,
  upp_int_smithy: uppIntSmithy,
  upp_int_runehall: uppIntRunehall,
  upp_int_hof: uppIntHof,
  myl_weir: mylWeir,
  myl_ford: mylFord,
  myl_river: mylRiver,
  myl_mill: mylMill,
  myl_fisher: mylFisher,
  myl_ferry: mylFerry,
  myl_springs: mylSprings,
  myl_peat: mylPeat,
  myl_bog: mylBog,
  myl_reeds: mylReeds,
  myl_int_fisher: mylIntFisher,
  myl_int_widow: mylIntWidow,
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
  d2_r01: d2R01,
  d2_r02: d2R02,
  d2_r03: d2R03,
  d2_r04: d2R04,
  d2_r05: d2R05,
  d2_r06: d2R06,
  d2_r07: d2R07,
  d2_r08: d2R08,
  d2_r09: d2R09,
  d2_r10: d2R10,
  d2_r11: d2R11,
  d2_r12: d2R12,
  d2_r13: d2R13,
  d2_r14: d2R14,
  d2_r15: d2R15,
  d2_r16: d2R16,
};
