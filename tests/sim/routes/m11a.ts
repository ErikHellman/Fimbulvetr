import type { ItemId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { Dir4 } from '@core/math/dir';
import type { GameState } from '@core/state/gameState';
import { tileFeet } from '@core/world/screen';
import { Harness, frameOf } from '../harness';
import { crossTo, finishStory, talkTo, walkTo } from '../walk';
import { warpTo } from './m8a';
import { iceTo } from './m9a';
import { settle } from './m8b';
import { alive, sing, travel, useAt } from './m7b';
import { face } from '../walk';

/** Puts `item` in slot K. */
function hold(h: Harness, item: ItemId): void {
  if (h.sim.state.inv.slots[0] === item) return;
  h.sim.command({ t: 'equip', slot: 0, item });
  h.idle(1);
}

/** Stands on (tx, ty) facing `dir` and uses `item` from slot K, waiting until Ask is free again. */
function useItem(h: Harness, item: ItemId, tx: number, ty: number, dir: Dir4, ticks = 60): void {
  hold(h, item);
  walkTo(h, tx, ty);
  face(h, dir);
  settle(h);
  h.press(['item1']).idle(ticks);
  alive(h);
}

function need(h: Harness, ok: boolean, what: string): void {
  if (!ok)
    throw new Error(
      `${what} not done on ${h.sim.screen.id} at tick ${String(h.sim.tick)}: ${JSON.stringify(h.sim.hero.pos)} ${h.sim.hero.fsm.s}`,
    );
}

/** In through a door north of (tx, ty) to `to`. */
function enter(h: Harness, tx: number, ty: number, to: ScreenId): void {
  walkTo(h, tx, ty);
  crossTo(h, 'n', to, 300);
  if (h.sim.mode === 'story') finishStory(h);
}

/** Out through the door south of (tx, ty) to `to`. */
function exit(h: Harness, tx: number, ty: number, to: ScreenId): void {
  walkTo(h, tx, ty);
  crossTo(h, 's', to, 300);
  if (h.sim.mode === 'story') finishStory(h);
}

/**
 * M11a: from spring at the farm after the ending (the M10b save). Halvar asks for the spring feast, Gyða for
 * the four missing names; the bauta-stones in Myrkviðr, Haugar, Sævatn and Hrímfjöll; the feast's mead,
 * fish and ale; the four hidden pieces of M11a and the Gjöll's islet; then the names to Gyða and the feast
 * at Halvar's table.
 */
export function playM11a(from: GameState): Harness {
  const h = new Harness({ state: from });
  h.idle(2);

  // The farm: Halvar asks for the feast.
  talkTo(h, 'halvar');
  // The village: Sigrún's mead, across her counter; Askdalr's warp stone woken for the way home.
  travel(h, 'ask_village');
  enter(h, 8, 6, 'ask_int_trader');
  useAt(h, 19, 12, 'n');
  exit(h, 19, 17, 'ask_village');
  useAt(h, 24, 15, 'n');
  need(h, h.sim.state.world.warps.includes('askdalr'), 'the Askdalr stone');
  // The hof: Gyða asks for the names.
  travel(h, 'ask_hof');
  enter(h, 20, 8, 'ask_int_hof');
  talkTo(h, 'gyda');
  exit(h, 20, 17, 'ask_hof');

  // North up the Myrkviðr road to its bauta-stone.
  travel(h, 'myr_road');
  useAt(h, 16, 8, 'n');
  need(h, h.sim.state.flags.q_feast_asked === true && h.sim.state.flags.q_feast_mead === true, 'feast asked');
  need(h, h.sim.state.flags.q_record_asked === true && h.sim.state.flags.st_bauta_myr === true, 'record');

  // Mýrland: Kári's burbot; then north over the water to Bárðr's far landing and its stone.
  travel(h, 'myl_fisher');
  talkTo(h, 'kari');
  need(h, h.sim.state.flags.q_feast_fish === true, 'the fish');
  travel(h, 'sae_landing');
  useAt(h, 32, 11, 'n');
  need(h, h.sim.state.flags.st_bauta_sae === true, 'the landing stone');

  // Haugar: the circle's stone, then the gully's sinkhole by the grapple, over and back.
  warpTo(h, 'haugar', 'hau_circle');
  useAt(h, 10, 10, 'n');
  travel(h, 'hau_gully');
  useItem(h, 'grapple', 9, 8, 'n');
  walkTo(h, 12, 3);
  need(h, h.sim.state.world.pieces.includes('hp_hau_sinkhole'), 'the sinkhole piece');
  useItem(h, 'grapple', 12, 5, 's');

  // North into the fog to the Gjöll's islet, by the grapple over the black pool and back.
  travel(h, 'nif_gjoll');
  useItem(h, 'grapple', 15, 2, 'w');
  walkTo(h, 3, 2);
  need(h, h.sim.state.world.pieces.includes('hp_nif_gjoll'), 'the Gjöll piece');
  useItem(h, 'grapple', 10, 3, 'e');

  // Dvergagröf: Dvalinn's ale, the miners' store behind its stake, and the slag pool's eye.
  warpTo(h, 'dvergagrof', 'dvg_chasm');
  travel(h, 'dvg_camp');
  talkTo(h, 'dvalinn');
  need(h, h.sim.state.flags.q_feast_cask === true, 'the ale');
  travel(h, 'dvg_ledges');
  useItem(h, 'hammer', 3, 4, 'n', h.sim.db.tuning.hero.hammerTicks + 2);
  walkTo(h, 4, 1);
  need(h, h.sim.state.world.pieces.includes('hp_dvg_store'), 'the store piece');
  travel(h, 'dvg_slag');
  sing(h, 38, 17, 'w', 'is');
  walkTo(h, 35, 17, 200);
  need(h, h.sim.state.world.pieces.includes('hp_dvg_slag'), 'the slag piece');
  sing(h, 35, 17, 'e', 'is');
  walkTo(h, 38, 17, 200);

  // Hrímfjöll, thawed: a dive into the saddle's tarn-eye, and the stone by the cairn.
  warpTo(h, 'hrimfjoll', 'hrf_beacon');
  travel(h, 'hrf_saddle');
  walkTo(h, 15, 15);
  h.until((s) => s.hero.fsm.s === 'swim', 60, frameOf(['down']));
  h.until((s) => s.hero.pos.y >= tileFeet({ x: 15, y: 17 }).y, 120, frameOf(['down']));
  h.step(frameOf([], ['roll']));
  h.until((s) => s.hero.fsm.s === 'swim', 300);
  need(h, h.sim.state.world.pieces.includes('hp_hrf_thaw'), 'the tarn-eye piece');
  walkTo(h, 15, 14);
  travel(h, 'hrf_tarn');
  iceTo(h, 34, 10);
  travel(h, 'hrf_cairn');
  useAt(h, 24, 10, 'n');
  need(h, h.sim.state.flags.q_record === 4, 'all four names');

  // Home: the names to Gyða, and the feast at Halvar's table.
  warpTo(h, 'askdalr', 'ask_village');
  travel(h, 'ask_hof');
  enter(h, 20, 8, 'ask_int_hof');
  talkTo(h, 'gyda');
  exit(h, 20, 17, 'ask_hof');
  travel(h, 'ask_farmyard');
  enter(h, 9, 8, 'ask_int_longhouse');
  useAt(h, 26, 16, 'n');
  alive(h);
  return h;
}
