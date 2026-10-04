import type { GameState } from '@core/state/gameState';
import { expect } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import type { Dir4 } from '@core/math/dir';
import { Harness, frameOf } from '../harness';
import { crossTo, face, fightNear, finishStory, talkTo, walkFighting, walkTo } from '../walk';

function alive(h: Harness): void {
  expect(h.sim.mode, `fell on ${h.sim.screen.id}`).not.toBe('over');
  h.expectAnims();
}

function leave(h: Harness, tx: number, ty: number, dir: Dir4, to: ScreenId): void {
  walkFighting(h, tx, ty);
  fightNear(h);
  walkTo(h, tx, ty);
  crossTo(h, dir, to);
  if (h.sim.mode === 'story') finishStory(h);
  alive(h);
}

const NIGHT_START = 22 * 60;
const isNight = (minute: number): boolean => minute >= NIGHT_START || minute < 5 * 60;

/** Waits in Hrafn's hut until the next night has fallen (a dawn between, so the strand is watched again). */
function waitForNight(h: Harness): void {
  h.until((s) => !isNight(s.state.clock.minute), 30 * 3600);
  h.until((s) => isNight(s.state.clock.minute), 30 * 3600);
}

/** Out onto the strand, fighting the night's marbendill off Hrafn's nets, then back into the hut. */
function guardTheNets(h: Harness): void {
  const night = h.sim.state.flags.q_seal_nights ?? 0;
  walkTo(h, 19, 14);
  crossTo(h, 's', 'nif_shore');
  walkTo(h, 12, 12);
  for (let i = 0; i < 100 && h.sim.enemies.some((e) => e.def === 'marbendill'); i++) {
    fightNear(h, 200, 60);
    h.idle(1);
    alive(h);
  }
  expect(h.sim.state.flags.q_seal_nights).toBe(Number(night) + 1);
  walkTo(h, 19, 10);
  h.until((s) => s.screen.id === 'nif_int_hut', 120, frameOf(['up']));
  h.idle(30);
}

/**
 * M7a: from the gate of Helgrind (the M6b save, a winter night) to Hrafn's hut, three nights guarding his nets
 * for the seal-skin, then west into Sævatn: over the winter ice and through the warm ring onto Holmr, where
 * Embla waits on the shore. In the Refuge's hall she gives her first letter. Without `from`, Niflmýrr is
 * opened at Hrafn's door in winter.
 */
export function playM7a(seed: number, from?: GameState): Harness {
  const h = new Harness(
    from === undefined
      ? {
          preset: DEV_PRESETS.fimbul,
          seed,
          screen: 'nif_shore',
          tile: [19, 11],
          season: 'winter',
          minute: 23 * 60,
        }
      : { state: from },
  );
  if (from === undefined)
    Object.assign(h.sim.state.flags, { st_rime_open: true, st_niflmyrr_reached: true, n_hrafn_met: true });
  h.idle(2);

  // From the gate of Helgrind down into the gorge and west along the causeway to the shore.
  if (h.sim.screen.id === 'nif_gate') {
    leave(h, 19, 21, 's', 'nif_gorge');
    leave(h, 1, 10, 'w', 'nif_causeway');
    leave(h, 1, 6, 'w', 'nif_deadwood');
    leave(h, 1, 13, 'w', 'nif_camp');
    leave(h, 1, 10, 'w', 'nif_shore');
  }
  walkFighting(h, 19, 10);
  h.until((s) => s.screen.id === 'nif_int_hut', 120, frameOf(['up']));
  h.idle(30);

  // Hrafn asks Ask to guard his nets for three nights.
  talkTo(h, 'hrafn');
  expect(h.sim.state.flags.q_sealskin_asked).toBe(true);
  if (!isNight(h.sim.state.clock.minute)) h.until((s) => isNight(s.state.clock.minute), 30 * 3600);
  for (let night = 0; night < 3; night++) {
    if (night > 0) waitForNight(h);
    guardTheNets(h);
  }
  talkTo(h, 'hrafn');
  expect(h.sim.state.inv.items.sealskin).toBe(1);
  expect(h.sim.state.flags.q_sealskin_done).toBe(true);
  alive(h);

  // West across the fjord's current into the lake, and down past the seal rocks to Holmr.
  walkTo(h, 19, 14);
  crossTo(h, 's', 'nif_shore');
  leave(h, 0, 10, 'w', 'sae_fjordmouth');
  leave(h, 20, 21, 's', 'sae_seal_rocks');
  leave(h, 20, 21, 's', 'sae_north');
  leave(h, 0, 10, 'w', 'sae_well');
  leave(h, 20, 21, 's', 'sae_holmr');

  // Through the warm ring and round to the south shore, where Embla is waiting.
  walkFighting(h, 20, 7);
  walkTo(h, 20, 18);
  h.until((s) => s.mode === 'story', 900, frameOf(['down']));
  finishStory(h);
  expect(h.sim.state.flags.st_embla_found).toBe(true);
  alive(h);

  // The warp stone by the door, then into the hall: Embla's first letter.
  walkFighting(h, 23, 10);
  face(h, 'n');
  h.step(frameOf([], ['interact']));
  h.idle(2);
  if (h.sim.mode === 'story') finishStory(h);
  expect(h.sim.state.world.warps).toContain('saevatn');
  walkTo(h, 18, 12);
  h.until((s) => s.screen.id === 'ref_int_hall', 120, frameOf(['up']));
  h.idle(30);
  // Carrying Hrafn's comb (the M6b save), she first trades her sail-needle for it.
  if ((h.sim.state.inv.items.trade_comb ?? 0) > 0) {
    talkTo(h, 'embla');
    expect(h.sim.state.flags.q_trade).toBe(5);
  }
  talkTo(h, 'embla');
  expect(h.sim.state.flags.q_letters).toBe(1);
  alive(h);
  return h;
}
