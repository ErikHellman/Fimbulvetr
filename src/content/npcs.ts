import type { NpcDef } from '@core/actors/npc';
import type { L10n } from '@core/i18n/t';
import type { Cond } from '@core/story/cond';
import { afterRaid, all, any, daytime, evening, eveningDue, not, raid, raidNight } from './dialogue/util';
import type { NpcId } from './ids';

/** Names as shown above their lines. Old Norse names are the same in both languages. */
export const NPC_NAMES: Readonly<Record<NpcId, L10n>> = {
  halvar: { en: 'Halvar', sv: 'Halvar' },
  embla: { en: 'Embla', sv: 'Embla' },
  gyda: { en: 'Gyða', sv: 'Gyða' },
  sigrun: { en: 'Sigrún', sv: 'Sigrún' },
  grimr: { en: 'Grímr', sv: 'Grímr' },
  asa: { en: 'Ása', sv: 'Ása' },
  bjarni: { en: 'Bjarni', sv: 'Bjarni' },
  ulf: { en: 'Ulf', sv: 'Ulf' },
  tofa: { en: 'Tófa', sv: 'Tófa' },
  oddr: { en: 'Oddr', sv: 'Oddr' },
  hallbera: { en: 'Hallbera', sv: 'Hallbera' },
  thorkell: { en: 'Þorkell', sv: 'Þorkell' },
  rannveig: { en: 'Rannveig', sv: 'Rannveig' },
  kolbeinn: { en: 'Kolbeinn', sv: 'Kolbeinn' },
  onundr: { en: 'Önundr', sv: 'Önundr' },
  dagny: { en: 'Dagný', sv: 'Dagný' },
  skeggi: { en: 'Skeggi', sv: 'Skeggi' },
  arnbjorg: { en: 'Arnbjörg', sv: 'Arnbjörg' },
  thordis: { en: 'Þórdís', sv: 'Þórdís' },
  hrafnkell: { en: 'Hrafnkell', sv: 'Hrafnkell' },
  ketill: { en: 'Ketill', sv: 'Ketill' },
  solvi: { en: 'Sölvi', sv: 'Sölvi' },
  gunnhildr: { en: 'Gunnhildr', sv: 'Gunnhildr' },
  bersi: { en: 'Bersi', sv: 'Bersi' },
  jorunn: { en: 'Jórunn', sv: 'Jórunn' },
  eyvindr: { en: 'Eyvindr', sv: 'Eyvindr' },
  hjalti: { en: 'Hjalti', sv: 'Hjalti' },
  glumr: { en: 'Glúmr', sv: 'Glúmr' },
  ragna: { en: 'Ragna', sv: 'Ragna' },
  steinn: { en: 'Steinn', sv: 'Steinn' },
  heidr: { en: 'Heiðr', sv: 'Heiðr' },
  huldra: { en: 'The huldra', sv: 'Huldran' },
};

/** Villagers are out and about except at night, until the raid takes them. */
const up: Cond = all({ k: 'not', c: { k: 'phase', is: 'night' } }, not(raid));

/** Rain or storm over the region: Uppvík's folk go indoors. */
const wet: Cond = { k: 'weather', is: ['rain', 'storm'] };
const night: Cond = { k: 'phase', is: 'night' };

const npc = (id: NpcId, places: NpcDef['places']): NpcDef => ({
  id,
  name: NPC_NAMES[id],
  art: `npc_${id}`,
  places,
});

/** Who lives where, and when. The first place whose condition holds is where an NPC stands. */
export const NPC_DEFS: Readonly<Partial<Record<NpcId, NpcDef>>> = {
  halvar: npc('halvar', [
    { when: raidNight, screen: 'ask_gate', at: { x: 18, y: 8 }, facing: 'n' },
    /** Wounded at the gate: he keeps to his bed after the raid. */
    { when: afterRaid, screen: 'ask_int_longhouse', at: { x: 27, y: 8 }, facing: 's' },
    { when: evening, screen: 'ask_int_longhouse', at: { x: 27, y: 9 }, facing: 's' },
    { screen: 'ask_farmyard', at: { x: 14, y: 10 }, facing: 's' },
  ]),
  embla: npc('embla', [
    /** Held by Kolbeinn's trolls at the gate; after the raid she is gone. */
    { when: raidNight, screen: 'ask_gate', at: { x: 22, y: 6 }, facing: 's' },
    {
      when: all(not(raid), any(eveningDue(1), eveningDue(2), eveningDue(3))),
      screen: 'ask_int_longhouse',
      at: { x: 19, y: 13 },
      facing: 's',
    },
    { when: all(not(raid), evening), screen: 'ask_int_longhouse', at: { x: 25, y: 9 }, facing: 's' },
    {
      when: not(raid),
      screen: 'ask_village',
      at: { x: 12, y: 11 },
      facing: 's',
      patrol: [
        { x: 12, y: 11 },
        { x: 16, y: 11 },
      ],
    },
  ]),
  gyda: npc('gyda', [{ screen: 'ask_int_hof', at: { x: 20, y: 11 }, facing: 's' }]),
  sigrun: npc('sigrun', [{ screen: 'ask_int_trader', at: { x: 19, y: 10 }, facing: 's' }]),
  grimr: npc('grimr', [
    { when: raidNight, screen: 'ask_gate', at: { x: 24, y: 9 }, facing: 'w' },
    { screen: 'ask_gate', at: { x: 20, y: 5 }, facing: 's' },
  ]),
  asa: npc('asa', [{ when: up, screen: 'ask_village', at: { x: 8, y: 14 }, facing: 's' }]),
  bjarni: npc('bjarni', [{ when: up, screen: 'ask_brook', at: { x: 24, y: 4 }, facing: 'e' }]),
  ulf: npc('ulf', [{ when: up, screen: 'ask_pasture', at: { x: 15, y: 4 }, facing: 's' }]),
  tofa: npc('tofa', [{ when: up, screen: 'ask_field', at: { x: 11, y: 19 }, facing: 'e' }]),
  oddr: npc('oddr', [{ when: up, screen: 'ask_field', at: { x: 26, y: 19 }, facing: 'w' }]),
  hallbera: npc('hallbera', [{ when: up, screen: 'ask_village', at: { x: 31, y: 7 }, facing: 's' }]),
  thorkell: npc('thorkell', [{ when: up, screen: 'ask_village', at: { x: 30, y: 14 }, facing: 's' }]),
  rannveig: npc('rannveig', [{ when: up, screen: 'ask_village', at: { x: 34, y: 14 }, facing: 'w' }]),
  /** The seiðmaðr who leads the raid. Only seen in cutscenes. */
  kolbeinn: npc('kolbeinn', [{ when: raidNight, screen: 'ask_gate', at: { x: 20, y: 6 }, facing: 's' }]),
  /** Myrkviðr. Önundr sleeps in his hut; the others keep to their fires all night. */
  onundr: npc('onundr', [
    { when: evening, screen: 'myr_int_hut', at: { x: 19, y: 12 }, facing: 's' },
    { screen: 'myr_clearing', at: { x: 23, y: 10 }, facing: 's' },
  ]),
  dagny: npc('dagny', [{ screen: 'myr_road', at: { x: 28, y: 7 }, facing: 'w' }]),
  skeggi: npc('skeggi', [{ screen: 'myr_charcoal', at: { x: 18, y: 11 }, facing: 'e' }]),
  arnbjorg: npc('arnbjorg', [{ screen: 'myr_roots', at: { x: 17, y: 9 }, facing: 'n' }]),
  /**
   * Uppvík. By evening the traders, the smith and the idlers crowd into Þórdís's mead hall; in rain the
   * outdoor folk shelter there or in Hrafnkell's house. Only Bersi stands his gate in any weather.
   */
  thordis: npc('thordis', [{ screen: 'upp_int_meadhall', at: { x: 19, y: 6 }, facing: 's' }]),
  hrafnkell: npc('hrafnkell', [
    { when: evening, screen: 'upp_int_meadhall', at: { x: 22, y: 10 }, facing: 'w' },
    { screen: 'upp_int_trader', at: { x: 19, y: 8 }, facing: 's' },
  ]),
  ketill: npc('ketill', [
    { when: evening, screen: 'upp_int_meadhall', at: { x: 27, y: 9 }, facing: 'n' },
    { when: wet, screen: 'upp_int_smithy', at: { x: 22, y: 10 }, facing: 'w' },
    { screen: 'upp_smiths', at: { x: 16, y: 7 }, facing: 'w' },
  ]),
  solvi: npc('solvi', [{ screen: 'upp_int_runehall', at: { x: 19, y: 10 }, facing: 's' }]),
  gunnhildr: npc('gunnhildr', [{ screen: 'upp_int_hof', at: { x: 23, y: 9 }, facing: 'w' }]),
  bersi: npc('bersi', [{ when: not(night), screen: 'upp_gate', at: { x: 24, y: 11 }, facing: 'w' }]),
  jorunn: npc('jorunn', [
    { when: all(daytime, wet), screen: 'upp_int_trader', at: { x: 15, y: 12 }, facing: 'e' },
    { when: daytime, screen: 'upp_square', at: { x: 12, y: 10 }, facing: 's' },
  ]),
  eyvindr: npc('eyvindr', [
    { when: any(evening, wet), screen: 'upp_int_meadhall', at: { x: 14, y: 13 }, facing: 'w' },
    { screen: 'upp_smiths', at: { x: 31, y: 11 }, facing: 'e' },
  ]),
  hjalti: npc('hjalti', [
    {
      when: all(daytime, not(wet)),
      screen: 'upp_square',
      at: { x: 22, y: 12 },
      facing: 'w',
      patrol: [
        { x: 22, y: 12 },
        { x: 22, y: 9 },
      ],
    },
  ]),
  glumr: npc('glumr', [
    { when: evening, screen: 'upp_int_meadhall', at: { x: 25, y: 13 }, facing: 'e' },
    { screen: 'upp_hall', at: { x: 28, y: 8 }, facing: 's' },
  ]),
  ragna: npc('ragna', [
    { when: any(evening, wet), screen: 'upp_int_meadhall', at: { x: 12, y: 11 }, facing: 's' },
    { screen: 'upp_smiths', at: { x: 24, y: 16 }, facing: 'e' },
  ]),
  steinn: npc('steinn', [{ screen: 'upp_int_meadhall', at: { x: 18, y: 10 }, facing: 'e' }]),
  /** The völva keeps to her hut in the fen, behind her brewing table. */
  heidr: npc('heidr', [{ screen: 'myr_int_volva', at: { x: 22, y: 11 }, facing: 's' }]),
  /** Only at night, by the stone in the birch ring, her back to the path: her tail shows. */
  huldra: npc('huldra', [{ when: night, screen: 'myr_glade', at: { x: 20, y: 11 }, facing: 'n' }]),
};
