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
  thingstone: THINGSTONE,
};
