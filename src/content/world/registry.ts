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
import { mylIntCave } from './myrland/myl_int_cave';
import { hauGully } from './haugar/hau_gully';
import { hauBarrows } from './haugar/hau_barrows';
import { hauHeath } from './haugar/hau_heath';
import { hauCairns } from './haugar/hau_cairns';
import { hauPass } from './haugar/hau_pass';
import { hauCircle } from './haugar/hau_circle';
import { hauHuscarl } from './haugar/hau_huscarl';
import { hauKing } from './haugar/hau_king';
import { hauTarn } from './haugar/hau_tarn';
import { hauWatch } from './haugar/hau_watch';
import { hauIntStyrr } from './haugar/hau_int_styrr';
import { hauIntCairn } from './haugar/hau_int_cairn';
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
import { d4R01 } from './helgrind/d4_r01';
import { d4R02 } from './helgrind/d4_r02';
import { d4R03 } from './helgrind/d4_r03';
import { d4R04 } from './helgrind/d4_r04';
import { d4R05 } from './helgrind/d4_r05';
import { d4R06 } from './helgrind/d4_r06';
import { d4R07 } from './helgrind/d4_r07';
import { d4R08 } from './helgrind/d4_r08';
import { d4R09 } from './helgrind/d4_r09';
import { d4R10 } from './helgrind/d4_r10';
import { d4R11 } from './helgrind/d4_r11';
import { d4R12 } from './helgrind/d4_r12';
import { d4R13 } from './helgrind/d4_r13';
import { d4R14 } from './helgrind/d4_r14';
import { d4R15 } from './helgrind/d4_r15';
import { d4R16 } from './helgrind/d4_r16';
import { d4R17 } from './helgrind/d4_r17';
import { d4R18 } from './helgrind/d4_r18';
import { d4R19 } from './helgrind/d4_r19';
import { d4R20 } from './helgrind/d4_r20';
import { d4R21 } from './helgrind/d4_r21';
import { d4R22 } from './helgrind/d4_r22';
import { saeLanding } from './saevatn/sae_landing';
import { saeOpen } from './saevatn/sae_open';
import { saeSkerries } from './saevatn/sae_skerries';
import { saeReedbank } from './saevatn/sae_reedbank';
import { saeDrowned } from './saevatn/sae_drowned';
import { saeHolmrFord } from './saevatn/sae_holmr_ford';
import { saeWreck } from './saevatn/sae_wreck';
import { saeHolmr } from './saevatn/sae_holmr';
import { saeNarrows } from './saevatn/sae_narrows';
import { saeWell } from './saevatn/sae_well';
import { saeNorth } from './saevatn/sae_north';
import { saeSealRocks } from './saevatn/sae_seal_rocks';
import { saeFjordmouth } from './saevatn/sae_fjordmouth';
import { refIntHall } from './saevatn/ref_int_hall';
import { saeIntWell } from './saevatn/sae_int_well';
import { d5R01 } from './hof/d5_r01';
import { d5R02 } from './hof/d5_r02';
import { d5R03 } from './hof/d5_r03';
import { d5R04 } from './hof/d5_r04';
import { d5R05 } from './hof/d5_r05';
import { d5R06 } from './hof/d5_r06';
import { d5R07 } from './hof/d5_r07';
import { d5R08 } from './hof/d5_r08';
import { d5R09 } from './hof/d5_r09';
import { d5R10 } from './hof/d5_r10';
import { d5R11 } from './hof/d5_r11';
import { d5R12 } from './hof/d5_r12';
import { d5R13 } from './hof/d5_r13';
import { d5R14 } from './hof/d5_r14';
import { d5R15 } from './hof/d5_r15';
import { d5R16 } from './hof/d5_r16';
import { d5R17 } from './hof/d5_r17';
import { d5R18 } from './hof/d5_r18';
import { d5R19 } from './hof/d5_r19';
import { d5R20 } from './hof/d5_r20';
import { d5R21 } from './hof/d5_r21';
import { d5R22 } from './hof/d5_r22';
import { d5R23 } from './hof/d5_r23';
import { d5R24 } from './hof/d5_r24';
import { dvgChasm } from './dvergagrof/dvg_chasm';
import { dvgCamp } from './dvergagrof/dvg_camp';
import { dvgMinehead } from './dvergagrof/dvg_minehead';
import { dvgVents } from './dvergagrof/dvg_vents';
import { dvgForgegate } from './dvergagrof/dvg_forgegate';
import { dvgScree } from './dvergagrof/dvg_scree';
import { dvgLedges } from './dvergagrof/dvg_ledges';
import { dvgSlag } from './dvergagrof/dvg_slag';
import { dvgPeak } from './dvergagrof/dvg_peak';
import { dvgAdit } from './dvergagrof/dvg_adit';
import { dvgIntForge } from './dvergagrof/dvg_int_forge';
import { dvgIntMine1 } from './dvergagrof/dvg_int_mine1';
import { dvgIntMine2 } from './dvergagrof/dvg_int_mine2';
import { dvgIntTunnel } from './dvergagrof/dvg_int_tunnel';
import { d6R01 } from './forge/d6_r01';
import { d6R02 } from './forge/d6_r02';
import { d6R03 } from './forge/d6_r03';
import { d6R04 } from './forge/d6_r04';
import { d6R05 } from './forge/d6_r05';
import { d6R06 } from './forge/d6_r06';
import { d6R07 } from './forge/d6_r07';
import { d6R08 } from './forge/d6_r08';
import { d6R09 } from './forge/d6_r09';
import { d6R10 } from './forge/d6_r10';
import { d6R11 } from './forge/d6_r11';
import { d6R12 } from './forge/d6_r12';
import { d6R13 } from './forge/d6_r13';
import { d6R14 } from './forge/d6_r14';
import { d6R15 } from './forge/d6_r15';
import { d6R16 } from './forge/d6_r16';
import { d6R17 } from './forge/d6_r17';
import { d6R18 } from './forge/d6_r18';
import { d6R19 } from './forge/d6_r19';
import { d6R20 } from './forge/d6_r20';
import { d6R21 } from './forge/d6_r21';
import { d6R22 } from './forge/d6_r22';
import { d6R23 } from './forge/d6_r23';
import { d6R24 } from './forge/d6_r24';
import { d6R25 } from './forge/d6_r25';
import { d6R26 } from './forge/d6_r26';
import { d6R27 } from './forge/d6_r27';
import { d6R28 } from './forge/d6_r28';
import { hrfRoad } from './hrimfjoll/hrf_road';
import { hrfIcefall } from './hrimfjoll/hrf_icefall';
import { hrfGlacier } from './hrimfjoll/hrf_glacier';
import { hrfCrevasse } from './hrimfjoll/hrf_crevasse';
import { hrfBeacon } from './hrimfjoll/hrf_beacon';
import { hrfSaddle } from './hrimfjoll/hrf_saddle';
import { hrfTarn } from './hrimfjoll/hrf_tarn';
import { hrfTowerfoot } from './hrimfjoll/hrf_towerfoot';
import { d7R01 } from './hrimturn/d7_r01';
import { d7R02 } from './hrimturn/d7_r02';
import { d7R03 } from './hrimturn/d7_r03';
import { d7R04 } from './hrimturn/d7_r04';
import { d7R05 } from './hrimturn/d7_r05';
import { d7R06 } from './hrimturn/d7_r06';
import { d7R07 } from './hrimturn/d7_r07';
import { d7R08 } from './hrimturn/d7_r08';
import { d7R09 } from './hrimturn/d7_r09';
import { d7R10 } from './hrimturn/d7_r10';
import { d7R11 } from './hrimturn/d7_r11';
import { d7R12 } from './hrimturn/d7_r12';
import { d7R13 } from './hrimturn/d7_r13';
import { d7R14 } from './hrimturn/d7_r14';
import { d7R15 } from './hrimturn/d7_r15';
import { d7R16 } from './hrimturn/d7_r16';
import { d7R17 } from './hrimturn/d7_r17';
import { d7R18 } from './hrimturn/d7_r18';
import { d7R19 } from './hrimturn/d7_r19';
import { d7R20 } from './hrimturn/d7_r20';
import { d7R21 } from './hrimturn/d7_r21';
import { d7R22 } from './hrimturn/d7_r22';
import { d7R23 } from './hrimturn/d7_r23';
import { d7R24 } from './hrimturn/d7_r24';
import { d7R25 } from './hrimturn/d7_r25';
import { d7R26 } from './hrimturn/d7_r26';
import { d7R27 } from './hrimturn/d7_r27';
import { d7R28 } from './hrimturn/d7_r28';
import { d7R29 } from './hrimturn/d7_r29';
import { d7R30 } from './hrimturn/d7_r30';
import { d7R31 } from './hrimturn/d7_r31';
import { d7R32 } from './hrimturn/d7_r32';
import { d8R01 } from './utgard/d8_r01';
import { d8R02 } from './utgard/d8_r02';
import { d8R03 } from './utgard/d8_r03';
import { d8R04 } from './utgard/d8_r04';
import { d8R05 } from './utgard/d8_r05';
import { d8R06 } from './utgard/d8_r06';
import { d8R07 } from './utgard/d8_r07';
import { d8R08 } from './utgard/d8_r08';
import { d8R09 } from './utgard/d8_r09';
import { d8R10 } from './utgard/d8_r10';
import { d8R11 } from './utgard/d8_r11';
import { d8R12 } from './utgard/d8_r12';
import { d8R13 } from './utgard/d8_r13';
import { d8R14 } from './utgard/d8_r14';
import { d8R15 } from './utgard/d8_r15';
import { d8R16 } from './utgard/d8_r16';
import { d8R17 } from './utgard/d8_r17';
import { d8R18 } from './utgard/d8_r18';
import { d8R19 } from './utgard/d8_r19';
import { d8R20 } from './utgard/d8_r20';
import { d8R21 } from './utgard/d8_r21';
import { d8R22 } from './utgard/d8_r22';
import { d8R23 } from './utgard/d8_r23';
import { d8R24 } from './utgard/d8_r24';
import { d8R25 } from './utgard/d8_r25';
import { d8R26 } from './utgard/d8_r26';
import { d8R27 } from './utgard/d8_r27';
import { d8R28 } from './utgard/d8_r28';
import { d8R29 } from './utgard/d8_r29';
import { d8R30 } from './utgard/d8_r30';
import { d8R31 } from './utgard/d8_r31';
import { d8R32 } from './utgard/d8_r32';
import { d8R33 } from './utgard/d8_r33';
import { d8R34 } from './utgard/d8_r34';
import { d8R35 } from './utgard/d8_r35';
import { d8R36 } from './utgard/d8_r36';
import { d8R37 } from './utgard/d8_r37';
import { d8R38 } from './utgard/d8_r38';
import { d8R39 } from './utgard/d8_r39';
import { d8R40 } from './utgard/d8_r40';
import { hrfCairn } from './hrimfjoll/hrf_cairn';
import { hrfUtgard } from './hrimfjoll/hrf_utgard';
import { hrfIntHut } from './hrimfjoll/hrf_int_hut';

import { d3R01 } from './konungshaugr/d3_r01';
import { d3R02 } from './konungshaugr/d3_r02';
import { d3R03 } from './konungshaugr/d3_r03';
import { d3R04 } from './konungshaugr/d3_r04';
import { d3R05 } from './konungshaugr/d3_r05';
import { d3R06 } from './konungshaugr/d3_r06';
import { d3R07 } from './konungshaugr/d3_r07';
import { d3R08 } from './konungshaugr/d3_r08';
import { d3R09 } from './konungshaugr/d3_r09';
import { d3R10 } from './konungshaugr/d3_r10';
import { d3R11 } from './konungshaugr/d3_r11';
import { d3R12 } from './konungshaugr/d3_r12';
import { d3R13 } from './konungshaugr/d3_r13';
import { d3R14 } from './konungshaugr/d3_r14';
import { d3R15 } from './konungshaugr/d3_r15';
import { d3R16 } from './konungshaugr/d3_r16';
import { d3R17 } from './konungshaugr/d3_r17';
import { d3R18 } from './konungshaugr/d3_r18';
import { d3R19 } from './konungshaugr/d3_r19';
import { d3R20 } from './konungshaugr/d3_r20';
import type { ScreenDef } from '@core/world/screen';
import type { ScreenId } from './screens';
import { testA } from './testlands/test_a';
import { testB } from './testlands/test_b';
import { testC } from './testlands/test_c';
import { testInt } from './testlands/test_int';
import { nifGorge } from './niflmyrr/nif_gorge';
import { nifCauseway } from './niflmyrr/nif_causeway';
import { nifDeadwood } from './niflmyrr/nif_deadwood';
import { nifCamp } from './niflmyrr/nif_camp';
import { nifShore } from './niflmyrr/nif_shore';
import { nifIntHut } from './niflmyrr/nif_int_hut';
import { nifGate } from './niflmyrr/nif_gate';
import { nifGjoll } from './niflmyrr/nif_gjoll';
import { nifJars } from './niflmyrr/nif_jars';
import { nifCairns } from './niflmyrr/nif_cairns';
import { nifStrand } from './niflmyrr/nif_strand';
import { nifIntCave } from './niflmyrr/nif_int_cave';

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
  myl_int_cave: mylIntCave,
  hau_gully: hauGully,
  hau_barrows: hauBarrows,
  hau_heath: hauHeath,
  hau_cairns: hauCairns,
  hau_pass: hauPass,
  hau_circle: hauCircle,
  hau_huscarl: hauHuscarl,
  hau_king: hauKing,
  hau_tarn: hauTarn,
  hau_watch: hauWatch,
  hau_int_styrr: hauIntStyrr,
  hau_int_cairn: hauIntCairn,
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
  d3_r01: d3R01,
  d3_r02: d3R02,
  d3_r03: d3R03,
  d3_r04: d3R04,
  d3_r05: d3R05,
  d3_r06: d3R06,
  d3_r07: d3R07,
  d3_r08: d3R08,
  d3_r09: d3R09,
  d3_r10: d3R10,
  d3_r11: d3R11,
  d3_r12: d3R12,
  d3_r13: d3R13,
  d3_r14: d3R14,
  d3_r15: d3R15,
  d3_r16: d3R16,
  d3_r17: d3R17,
  d3_r18: d3R18,
  d3_r19: d3R19,
  d3_r20: d3R20,
  nif_gorge: nifGorge,
  nif_causeway: nifCauseway,
  nif_deadwood: nifDeadwood,
  nif_camp: nifCamp,
  nif_shore: nifShore,
  nif_int_hut: nifIntHut,
  nif_gate: nifGate,
  nif_gjoll: nifGjoll,
  nif_jars: nifJars,
  nif_cairns: nifCairns,
  nif_strand: nifStrand,
  nif_int_cave: nifIntCave,
  d4_r01: d4R01,
  d4_r02: d4R02,
  d4_r03: d4R03,
  d4_r04: d4R04,
  d4_r05: d4R05,
  d4_r06: d4R06,
  d4_r07: d4R07,
  d4_r08: d4R08,
  d4_r09: d4R09,
  d4_r10: d4R10,
  d4_r11: d4R11,
  d4_r12: d4R12,
  d4_r13: d4R13,
  d4_r14: d4R14,
  d4_r15: d4R15,
  d4_r16: d4R16,
  d4_r17: d4R17,
  d4_r18: d4R18,
  d4_r19: d4R19,
  d4_r20: d4R20,
  d4_r21: d4R21,
  d4_r22: d4R22,
  sae_landing: saeLanding,
  sae_open: saeOpen,
  sae_skerries: saeSkerries,
  sae_reedbank: saeReedbank,
  sae_drowned: saeDrowned,
  sae_holmr_ford: saeHolmrFord,
  sae_wreck: saeWreck,
  sae_holmr: saeHolmr,
  sae_narrows: saeNarrows,
  sae_well: saeWell,
  sae_int_well: saeIntWell,
  sae_north: saeNorth,
  sae_seal_rocks: saeSealRocks,
  sae_fjordmouth: saeFjordmouth,
  ref_int_hall: refIntHall,
  d5_r01: d5R01,
  d5_r02: d5R02,
  d5_r03: d5R03,
  d5_r04: d5R04,
  d5_r05: d5R05,
  d5_r06: d5R06,
  d5_r07: d5R07,
  d5_r08: d5R08,
  d5_r09: d5R09,
  d5_r10: d5R10,
  d5_r11: d5R11,
  d5_r12: d5R12,
  d5_r13: d5R13,
  d5_r14: d5R14,
  d5_r15: d5R15,
  d5_r16: d5R16,
  d5_r17: d5R17,
  d5_r18: d5R18,
  d5_r19: d5R19,
  d5_r20: d5R20,
  d5_r21: d5R21,
  d5_r22: d5R22,
  d5_r23: d5R23,
  d5_r24: d5R24,
  dvg_chasm: dvgChasm,
  dvg_camp: dvgCamp,
  dvg_minehead: dvgMinehead,
  dvg_vents: dvgVents,
  dvg_forgegate: dvgForgegate,
  dvg_scree: dvgScree,
  dvg_ledges: dvgLedges,
  dvg_slag: dvgSlag,
  dvg_peak: dvgPeak,
  dvg_adit: dvgAdit,
  dvg_int_forge: dvgIntForge,
  dvg_int_mine1: dvgIntMine1,
  dvg_int_mine2: dvgIntMine2,
  dvg_int_tunnel: dvgIntTunnel,
  d6_r01: d6R01,
  d6_r02: d6R02,
  d6_r03: d6R03,
  d6_r04: d6R04,
  d6_r05: d6R05,
  d6_r06: d6R06,
  d6_r07: d6R07,
  d6_r08: d6R08,
  d6_r09: d6R09,
  d6_r10: d6R10,
  d6_r11: d6R11,
  d6_r12: d6R12,
  d6_r13: d6R13,
  d6_r14: d6R14,
  d6_r15: d6R15,
  d6_r16: d6R16,
  d6_r17: d6R17,
  d6_r18: d6R18,
  d6_r19: d6R19,
  d6_r20: d6R20,
  d6_r21: d6R21,
  d6_r22: d6R22,
  d6_r23: d6R23,
  d6_r24: d6R24,
  d6_r25: d6R25,
  d6_r26: d6R26,
  d6_r27: d6R27,
  d6_r28: d6R28,
  hrf_road: hrfRoad,
  hrf_icefall: hrfIcefall,
  hrf_glacier: hrfGlacier,
  hrf_crevasse: hrfCrevasse,
  hrf_beacon: hrfBeacon,
  hrf_saddle: hrfSaddle,
  hrf_tarn: hrfTarn,
  hrf_towerfoot: hrfTowerfoot,
  hrf_cairn: hrfCairn,
  hrf_utgard: hrfUtgard,
  hrf_int_hut: hrfIntHut,
  d7_r01: d7R01,
  d7_r02: d7R02,
  d7_r03: d7R03,
  d7_r04: d7R04,
  d7_r05: d7R05,
  d7_r06: d7R06,
  d7_r07: d7R07,
  d7_r08: d7R08,
  d7_r09: d7R09,
  d7_r10: d7R10,
  d7_r11: d7R11,
  d7_r12: d7R12,
  d7_r13: d7R13,
  d7_r14: d7R14,
  d7_r15: d7R15,
  d7_r16: d7R16,
  d7_r17: d7R17,
  d7_r18: d7R18,
  d7_r19: d7R19,
  d7_r20: d7R20,
  d7_r21: d7R21,
  d7_r22: d7R22,
  d7_r23: d7R23,
  d7_r24: d7R24,
  d7_r25: d7R25,
  d7_r26: d7R26,
  d7_r27: d7R27,
  d7_r28: d7R28,
  d7_r29: d7R29,
  d7_r30: d7R30,
  d7_r31: d7R31,
  d7_r32: d7R32,
  d8_r01: d8R01,
  d8_r02: d8R02,
  d8_r03: d8R03,
  d8_r04: d8R04,
  d8_r05: d8R05,
  d8_r06: d8R06,
  d8_r07: d8R07,
  d8_r08: d8R08,
  d8_r09: d8R09,
  d8_r10: d8R10,
  d8_r11: d8R11,
  d8_r12: d8R12,
  d8_r13: d8R13,
  d8_r14: d8R14,
  d8_r15: d8R15,
  d8_r16: d8R16,
  d8_r17: d8R17,
  d8_r18: d8R18,
  d8_r19: d8R19,
  d8_r20: d8R20,
  d8_r21: d8R21,
  d8_r22: d8R22,
  d8_r23: d8R23,
  d8_r24: d8R24,
  d8_r25: d8R25,
  d8_r26: d8R26,
  d8_r27: d8R27,
  d8_r28: d8R28,
  d8_r29: d8R29,
  d8_r30: d8R30,
  d8_r31: d8R31,
  d8_r32: d8R32,
  d8_r33: d8R33,
  d8_r34: d8R34,
  d8_r35: d8R35,
  d8_r36: d8R36,
  d8_r37: d8R37,
  d8_r38: d8R38,
  d8_r39: d8R39,
  d8_r40: d8R40,
};
