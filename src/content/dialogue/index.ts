import type { DialogueDef } from '@core/story/dialogue';
import type { DialogueId } from '../ids';
import { ASA } from './asa';
import { BJARNI } from './bjarni';
import { EMBLA } from './embla';
import { GRIMR } from './grimr';
import { GYDA } from './gyda';
import { HALLBERA } from './hallbera';
import { HALVAR } from './halvar';
import { KOLBEINN } from './kolbeinn';
import { ODDR } from './oddr';
import { RANNVEIG } from './rannveig';
import { SIGRUN } from './sigrun';
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
};
