import type { NpcDef } from '@core/actors/npc';
import type { L10n } from '@core/i18n/t';
import type { Cond } from '@core/story/cond';
import {
  afterRaid,
  all,
  any,
  atLeast,
  daytime,
  evening,
  eveningDue,
  flag,
  not,
  raid,
  raidNight,
} from './dialogue/util';
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
  kari: { en: 'Kári', sv: 'Kári' },
  bardr: { en: 'Bárðr', sv: 'Bárðr' },
  thuridr: { en: 'Þuríðr', sv: 'Þuríðr' },
  ljotr: { en: 'Ljótr', sv: 'Ljótr' },
  audr: { en: 'Auðr', sv: 'Auðr' },
  styrr: { en: 'Styrr', sv: 'Styrr' },
  hildr: { en: 'Hildr', sv: 'Hildr' },
  geirmundr: { en: 'Geirmundr', sv: 'Geirmundr' },
  hallsteinn: { en: 'Hallsteinn', sv: 'Hallsteinn' },
  thrall: { en: 'A bled thrall', sv: 'En tappad träl' },
  bragi: { en: 'Bragi', sv: 'Bragi' },
  hrafn: { en: 'Hrafn', sv: 'Hrafn' },
  vala: { en: 'Vala', sv: 'Vala' },
  hreggvidr: { en: 'Hreggviðr', sv: 'Hreggviðr' },
  urdr: { en: 'Urðr', sv: 'Urd' },
  verdandi: { en: 'Verðandi', sv: 'Verdandi' },
  skuld: { en: 'Skuld', sv: 'Skuld' },
  dvalinn: { en: 'Dvalinn', sv: 'Dvalinn' },
  hekla: { en: 'Hekla', sv: 'Hekla' },
  sindri: { en: 'Sindri', sv: 'Sindri' },
  nyr: { en: 'Nýr', sv: 'Nýr' },
  nali: { en: 'Náli', sv: 'Náli' },
  ormr: { en: 'Ormr', sv: 'Ormr' },
};

/** Villagers are out and about except at night, until the raid takes them. */
const up: Cond = all({ k: 'not', c: { k: 'phase', is: 'night' } }, not(raid));

/** Rain or storm over the region: Uppvík's folk go indoors. */
const wet: Cond = { k: 'weather', is: ['rain', 'storm'] };
const night: Cond = { k: 'phase', is: 'night' };

/** A captive freed from Helgrind is home by day; one still held sits in a cell there. */
type Captive = 'ulf' | 'tofa' | 'oddr' | 'hallbera' | 'thorkell' | 'rannveig' | 'asa' | 'bjarni';
const freed = (who: Captive): Cond =>
  all(flag(`st_freed_${who}`), { k: 'not', c: { k: 'phase', is: 'night' } });
const held = (who: Captive): Cond => all(afterRaid, not(flag(`st_freed_${who}`)));

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
    /** After the fourth thane (M10a): up at Útgarðr's gate, to speak the binding-words, and there until the King is dead. */
    {
      when: all(flag('st_thane_hrimgerdr'), not(flag('st_hrimnir_dead'))),
      screen: 'hrf_utgard',
      at: { x: 23, y: 9 },
      facing: 'w',
    },
    /** Up again once the longhouse has its roof (farm stage 1): he works the yard by day. */
    {
      when: all(afterRaid, atLeast('q_farm', 1), not(evening)),
      screen: 'ask_farmyard',
      at: { x: 14, y: 10 },
      facing: 's',
    },
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
    /** Home at the farm once it is all over (M10b). */
    { when: flag('st_game_done'), screen: 'ask_farmyard', at: { x: 17, y: 10 }, facing: 's' },
    /** At the Refuge on Holmr once the pass is open (M7a): waiting on the shore until Ask first lands, then
     *  by the war table by day and at the hearth in the evening. */
    {
      when: all(flag('st_pass_open'), not(flag('st_embla_found'))),
      screen: 'sae_holmr',
      at: { x: 18, y: 18 },
      facing: 's',
    },
    { when: all(flag('st_pass_open'), evening), screen: 'ref_int_hall', at: { x: 16, y: 9 }, facing: 's' },
    { when: flag('st_pass_open'), screen: 'ref_int_hall', at: { x: 21, y: 11 }, facing: 's' },
  ]),
  gyda: npc('gyda', [{ screen: 'ask_int_hof', at: { x: 20, y: 11 }, facing: 's' }]),
  sigrun: npc('sigrun', [{ screen: 'ask_int_trader', at: { x: 19, y: 10 }, facing: 's' }]),
  grimr: npc('grimr', [
    { when: raidNight, screen: 'ask_gate', at: { x: 24, y: 9 }, facing: 'w' },
    { screen: 'ask_gate', at: { x: 20, y: 5 }, facing: 's' },
  ]),
  /** Taken in the raid to cells in Hrímturn (M9b); home by day once Hrímgerðr falls. */
  asa: npc('asa', [
    { when: freed('asa'), screen: 'ask_village', at: { x: 8, y: 14 }, facing: 's' },
    { when: held('asa'), screen: 'd7_r19', at: { x: 27, y: 10 }, facing: 'w' },
    { when: up, screen: 'ask_village', at: { x: 8, y: 14 }, facing: 's' },
  ]),
  bjarni: npc('bjarni', [
    { when: freed('bjarni'), screen: 'ask_brook', at: { x: 24, y: 4 }, facing: 'e' },
    { when: held('bjarni'), screen: 'd7_r18', at: { x: 27, y: 10 }, facing: 'w' },
    { when: up, screen: 'ask_brook', at: { x: 24, y: 4 }, facing: 'e' },
  ]),
  /** Taken in the raid to a cell in Helgrind; home to the pasture by day once Náströnd falls. */
  ulf: npc('ulf', [
    { when: freed('ulf'), screen: 'ask_pasture', at: { x: 15, y: 4 }, facing: 's' },
    { when: held('ulf'), screen: 'd4_r18', at: { x: 11, y: 10 }, facing: 'e' },
    { when: up, screen: 'ask_pasture', at: { x: 15, y: 4 }, facing: 's' },
  ]),
  /** Taken in the raid to a cell in Helgrind; home to her stall at the field fence by day after. */
  tofa: npc('tofa', [
    { when: freed('tofa'), screen: 'ask_field', at: { x: 9, y: 15 }, facing: 's' },
    { when: held('tofa'), screen: 'd4_r19', at: { x: 19, y: 5 }, facing: 's' },
    { when: up, screen: 'ask_field', at: { x: 11, y: 19 }, facing: 'e' },
  ]),
  /** Taken in the raid to a cell in Sökkva Hof (M7b); home by day once Nykr falls. */
  oddr: npc('oddr', [
    { when: freed('oddr'), screen: 'ask_field', at: { x: 26, y: 19 }, facing: 'w' },
    { when: held('oddr'), screen: 'd5_r18', at: { x: 28, y: 10 }, facing: 'w' },
    { when: up, screen: 'ask_field', at: { x: 26, y: 19 }, facing: 'w' },
  ]),
  hallbera: npc('hallbera', [
    { when: freed('hallbera'), screen: 'ask_village', at: { x: 31, y: 6 }, facing: 's' },
    { when: held('hallbera'), screen: 'd5_r21', at: { x: 28, y: 10 }, facing: 'w' },
    { when: up, screen: 'ask_village', at: { x: 31, y: 7 }, facing: 's' },
  ]),
  /** Taken in the raid to cells in Ívaldi's Forge (M8b); home by day once Ívaldi falls. */
  thorkell: npc('thorkell', [
    { when: freed('thorkell'), screen: 'ask_village', at: { x: 26, y: 19 }, facing: 'e' },
    { when: held('thorkell'), screen: 'd6_r09', at: { x: 27, y: 10 }, facing: 'w' },
    { when: up, screen: 'ask_village', at: { x: 30, y: 14 }, facing: 's' },
  ]),
  rannveig: npc('rannveig', [
    { when: freed('rannveig'), screen: 'ask_village', at: { x: 31, y: 19 }, facing: 's' },
    { when: held('rannveig'), screen: 'd6_r08', at: { x: 27, y: 10 }, facing: 'w' },
    { when: up, screen: 'ask_village', at: { x: 34, y: 14 }, facing: 'w' },
  ]),
  /** The seiðmaðr who leads the raid. Only seen in cutscenes. */
  kolbeinn: npc('kolbeinn', [
    { when: raidNight, screen: 'ask_gate', at: { x: 20, y: 6 }, facing: 's' },
    /** Beaten in his hall (M10a): on his knees until Ask spares him or kills him. */
    {
      when: all(flag('st_kolbeinn_beaten'), not(flag('st_kolbeinn_spared')), not(flag('st_kolbeinn_slain'))),
      screen: 'd8_r13',
      at: { x: 20, y: 6 },
      facing: 's',
    },
  ]),
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
  /** By his jetty by day; at night in his hut, mending nets. */
  kari: npc('kari', [
    { when: night, screen: 'myl_int_fisher', at: { x: 21, y: 10 }, facing: 's' },
    { screen: 'myl_fisher', at: { x: 23, y: 9 }, facing: 'w' },
  ]),
  /** At the foot of his landing, day and night: nobody takes his boat. */
  bardr: npc('bardr', [{ screen: 'myl_ferry', at: { x: 22, y: 9 }, facing: 'n' }]),
  thuridr: npc('thuridr', [{ screen: 'myl_int_widow', at: { x: 21, y: 11 }, facing: 's' }]),
  /** Cutting peat by day. */
  ljotr: npc('ljotr', [
    { when: { k: 'not', c: night }, screen: 'myl_peat', at: { x: 20, y: 18 }, facing: 'n' },
  ]),
  /** In the reed beds by day. */
  audr: npc('audr', [
    { when: { k: 'not', c: night }, screen: 'myl_reeds', at: { x: 10, y: 4 }, facing: 's' },
  ]),
  /** Styrr keeps to his cottage: by the hearth by day, by the door at night. */
  /** In his cottage; out in the yard (as a duellist, not here) while the last duel is on. */
  styrr: npc('styrr', [
    { when: not(flag('ev_duel_on')), screen: 'hau_int_styrr', at: { x: 22, y: 11 }, facing: 's' },
  ]),
  /** With her sheep on the heath by day; home before dark. */
  hildr: npc('hildr', [
    /** With the fold raised (farm stage 2) and her flock gathered (`q_herd`) she winters in Askdalr's pasture. */
    {
      when: all(atLeast('q_farm', 2), flag('q_herd_done')),
      screen: 'ask_pasture',
      at: { x: 20, y: 9 },
      facing: 's',
    },
    { when: { k: 'not', c: night }, screen: 'hau_heath', at: { x: 17, y: 5 }, facing: 's' },
  ]),
  /** By his tent at the barrow field by day; at night he hides inside it. */
  geirmundr: npc('geirmundr', [
    { when: { k: 'not', c: night }, screen: 'hau_barrows', at: { x: 14, y: 18 }, facing: 's' },
  ]),
  /** At the pass door, day and night. */
  hallsteinn: npc('hallsteinn', [{ screen: 'hau_pass', at: { x: 22, y: 6 }, facing: 's' }]),
  /** Chained in the drained camp's ring of flags until he has told what he knows; then he is dust. */
  thrall: npc('thrall', [
    { when: not(flag('st_twist_heard')), screen: 'nif_camp', at: { x: 16, y: 9 }, facing: 's' },
  ]),
  /** The seal-hunter, at home in his hut on the shore. */
  hrafn: npc('hrafn', [{ screen: 'nif_int_hut', at: { x: 17, y: 11 }, facing: 's' }]),
  /** The wandering skald: by his fire in the drained camp from evening to dawn. */
  bragi: npc('bragi', [{ when: evening, screen: 'nif_camp', at: { x: 35, y: 12 }, facing: 's' }]),
  /** The Refuge's healer and ore-trader, each behind a table in the longhouse on Holmr (M7a). */
  vala: npc('vala', [{ screen: 'ref_int_hall', at: { x: 12, y: 12 }, facing: 'e' }]),
  hreggvidr: npc('hreggvidr', [{ screen: 'ref_int_hall', at: { x: 27, y: 12 }, facing: 'w' }]),
  /** The three Norns at their loom by Urðr's well, under Sævatn (M7b): what was, what is, what shall be. */
  urdr: npc('urdr', [{ screen: 'sae_int_well', at: { x: 20, y: 7 }, facing: 's' }]),
  verdandi: npc('verdandi', [{ screen: 'sae_int_well', at: { x: 15, y: 7 }, facing: 's' }]),
  skuld: npc('skuld', [{ screen: 'sae_int_well', at: { x: 25, y: 7 }, facing: 's' }]),
  /** Dvergagröf (M8a). The foreman at his camp, by his anvil. */
  dvalinn: npc('dvalinn', [{ screen: 'dvg_camp', at: { x: 22, y: 8 }, facing: 's' }]),
  /** His daughter waits at the mine mouth while the escort is on (`q_foreman` 3), else at the camp. */
  hekla: npc('hekla', [
    { when: { k: 'flag', id: 'q_foreman', eq: 3 }, screen: 'dvg_minehead', at: { x: 22, y: 6 }, facing: 'w' },
    { screen: 'dvg_camp', at: { x: 16, y: 7 }, facing: 'e' },
  ]),
  /** At his anvil, inside the smithy. */
  sindri: npc('sindri', [{ screen: 'dvg_int_forge', at: { x: 22, y: 8 }, facing: 's' }]),
  /** Two of the crew: trapped in the lamp-room until Hekla leads them out, then at the camp's tents. */
  nyr: npc('nyr', [
    { when: atLeast('q_foreman', 4), screen: 'dvg_camp', at: { x: 8, y: 6 }, facing: 's' },
    { screen: 'dvg_int_mine2', at: { x: 9, y: 6 }, facing: 'e' },
  ]),
  nali: npc('nali', [
    { when: atLeast('q_foreman', 4), screen: 'dvg_camp', at: { x: 13, y: 13 }, facing: 'n' },
    { screen: 'dvg_int_mine2', at: { x: 12, y: 8 }, facing: 'n' },
  ]),
  /** Ormr the beacon-keeper (M9a), by his hearth under the beacon. */
  ormr: npc('ormr', [{ screen: 'hrf_int_hut', at: { x: 18, y: 9 }, facing: 's' }]),
};
