import type { DialogueDef } from '@core/story/dialogue';
import type { DialogueId } from '../ids';
import { ARNBJORG } from './arnbjorg';
import { ASA } from './asa';
import { BERSI } from './bersi';
import { BJARNI } from './bjarni';
import { DAGNY } from './dagny';
import { EMBLA } from './embla';
import { EYVINDR } from './eyvindr';
import { GLUMR } from './glumr';
import { GRIMR } from './grimr';
import { GUNNHILDR } from './gunnhildr';
import { GYDA } from './gyda';
import { HALLBERA } from './hallbera';
import { HALVAR } from './halvar';
import { HEIDR } from './heidr';
import { HULDRA } from './huldra';
import { HJALTI } from './hjalti';
import { HRAFNKELL } from './hrafnkell';
import { JORUNN } from './jorunn';
import { KETILL } from './ketill';
import { KOLBEINN } from './kolbeinn';
import { ODDR } from './oddr';
import { ONUNDR } from './onundr';
import { RAGNA } from './ragna';
import { RANNVEIG } from './rannveig';
import { SIGRUN } from './sigrun';
import { SKEGGI } from './skeggi';
import { SOLVI } from './solvi';
import { STEINN } from './steinn';
import { THORDIS } from './thordis';
import { THINGSTONE } from './thingstone';
import { THORKELL } from './thorkell';
import { TOFA } from './tofa';
import { ULF } from './ulf';
import { KARI } from './kari';
import { BARDR, BARDR_FERRY } from './bardr';
import { VALA } from './vala';
import { HREGGVIDR } from './hreggvidr';
import { DVALINN } from './dvalinn';
import { HEKLA } from './hekla';
import { NALI, NYR } from './miners';
import { ORMR } from './ormr';
import { SINDRI } from './sindri';
import { THURIDR } from './thuridr';
import { LJOTR } from './ljotr';
import { AUDR } from './audr';
import { STYRR } from './styrr';
import { HILDR } from './hildr';
import { GEIRMUNDR } from './geirmundr';
import { HALLSTEINN } from './hallsteinn';
import { THRALL } from './thrall';
import { BRAGI } from './bragi';
import { HRAFN } from './hrafn';
import { HOF_SEASON, SKULD, URDR, VERDANDI } from './norns';

/** Dialogue graphs by id. Every NPC's graph lives in its own file next to this one. */
export const DIALOGUE: Readonly<Partial<Record<DialogueId, DialogueDef>>> = {
  halvar: HALVAR,
  embla: EMBLA,
  gyda: GYDA,
  sigrun: SIGRUN,
  grimr: GRIMR,
  asa: ASA,
  bjarni: BJARNI,
  ulf: ULF,
  tofa: TOFA,
  oddr: ODDR,
  hallbera: HALLBERA,
  thorkell: THORKELL,
  rannveig: RANNVEIG,
  kolbeinn: KOLBEINN,
  onundr: ONUNDR,
  dagny: DAGNY,
  skeggi: SKEGGI,
  arnbjorg: ARNBJORG,
  thordis: THORDIS,
  hrafnkell: HRAFNKELL,
  ketill: KETILL,
  solvi: SOLVI,
  gunnhildr: GUNNHILDR,
  bersi: BERSI,
  jorunn: JORUNN,
  eyvindr: EYVINDR,
  hjalti: HJALTI,
  glumr: GLUMR,
  ragna: RAGNA,
  steinn: STEINN,
  heidr: HEIDR,
  huldra: HULDRA,
  kari: KARI,
  bardr: BARDR,
  thuridr: THURIDR,
  ljotr: LJOTR,
  audr: AUDR,
  styrr: STYRR,
  hildr: HILDR,
  geirmundr: GEIRMUNDR,
  hallsteinn: HALLSTEINN,
  thrall: THRALL,
  bragi: BRAGI,
  hrafn: HRAFN,
  vala: VALA,
  hreggvidr: HREGGVIDR,
  dvalinn: DVALINN,
  hekla: HEKLA,
  sindri: SINDRI,
  nyr: NYR,
  nali: NALI,
  ormr: ORMR,
  thingstone: THINGSTONE,
  bardr_ferry: BARDR_FERRY,
  urdr: URDR,
  verdandi: VERDANDI,
  skuld: SKULD,
  hof_season: HOF_SEASON,
};
