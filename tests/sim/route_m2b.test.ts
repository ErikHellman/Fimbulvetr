import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import type { Dir4 } from '@core/math/dir';
import { Harness, frameOf } from './harness';
import {
  buyInShop,
  crossFighting,
  crossTo,
  face,
  finishStory,
  interactNorth,
  talkTo,
  walkFighting,
  walkTo,
} from './walk';

/** Every leg ends with the hero standing, every entity drawable. */
function alive(h: Harness): void {
  expect(h.sim.mode, `fell on ${h.sim.screen.id}`).not.toBe('over');
  h.expectAnims();
}

/** Walks (fighting) to a tile at the edge and steps over it onto the next screen. */
function leave(h: Harness, tx: number, ty: number, dir: Dir4, to: ScreenId): void {
  walkFighting(h, tx, ty);
  crossFighting(h, dir, to);
  if (h.sim.mode === 'story') finishStory(h);
  alive(h);
}

/** Walks up to a door (from the tile below or above it) and through it. */
function door(h: Harness, tx: number, ty: number, dir: 'n' | 's', to: ScreenId): void {
  walkTo(h, tx, ty);
  crossTo(h, dir, to);
  alive(h);
}

/** Uppvík's square to Skeggi's kiln: down the north road, east under the roots, south through the pines. */
function toSkeggi(h: Harness): void {
  leave(h, 19, 20, 's', 'upp_gate');
  leave(h, 19, 20, 's', 'myr_north');
  leave(h, 19, 20, 's', 'myr_deep');
  leave(h, 38, 13, 'e', 'myr_roots');
  leave(h, 26, 20, 's', 'myr_pines');
  leave(h, 31, 20, 's', 'myr_charcoal');
}

/** And back up to the square. */
function toSquare(h: Harness): void {
  leave(h, 31, 1, 'n', 'myr_pines');
  leave(h, 26, 1, 'n', 'myr_roots');
  leave(h, 1, 13, 'w', 'myr_deep');
  leave(h, 19, 1, 'n', 'myr_north');
  leave(h, 19, 1, 'n', 'upp_gate');
  leave(h, 19, 1, 'n', 'upp_square');
}

/** From Önundr's clearing after Rótarhellir to Eldr learned and the first leaves burning. */
export function playM2b(seed: number): Harness {
  const h = new Harness({ preset: DEV_PRESETS.north, seed });

  // Önundr saws the pine; the road north lies open.
  talkTo(h, 'onundr');
  expect(h.sim.state.flags.st_road_open).toBe(true);
  leave(h, 38, 10, 'e', 'myr_road');
  leave(h, 19, 1, 'n', 'myr_deep');
  leave(h, 19, 1, 'n', 'myr_north');
  leave(h, 19, 1, 'n', 'upp_gate');
  // The first sight of the town: a card.
  h.until((s) => s.mode === 'story', 200, frameOf(['up']));
  finishStory(h);
  expect(h.sim.state.flags.st_uppvik_reached).toBe(true);
  leave(h, 19, 1, 'n', 'upp_square');

  // Þórdís's welcome and the first horn.
  leave(h, 1, 10, 'w', 'upp_hall');
  door(h, 16, 8, 'n', 'upp_int_meadhall');
  talkTo(h, 'thordis');
  expect(h.sim.state.inv.items.horn).toBe(1);
  door(h, 19, 16, 's', 'upp_hall');
  leave(h, 38, 10, 'e', 'upp_square');

  // Red mead from Hrafnkell, in the new horn.
  door(h, 8, 7, 'n', 'upp_int_trader');
  const silver = h.sim.state.hero.silver;
  interactNorth(h, 18, 9);
  buyInShop(h, 0);
  expect(h.sim.state.inv.items.mead_red).toBe(1);
  expect(h.sim.state.hero.silver).toBe(silver - 20);
  door(h, 19, 15, 's', 'upp_square');

  // Sölvi asks for a charred stave.
  leave(h, 38, 10, 'e', 'upp_smiths');
  door(h, 9, 18, 'n', 'upp_int_runehall');
  talkTo(h, 'solvi');
  expect(h.sim.state.flags.q_eldr_asked).toBe(true);
  door(h, 19, 15, 's', 'upp_smiths');
  leave(h, 1, 10, 'w', 'upp_square');

  // Skeggi's kiln, and back.
  toSkeggi(h);
  talkTo(h, 'skeggi');
  expect(h.sim.state.inv.items.charred_stave).toBe(1);
  toSquare(h);

  // The lesson.
  leave(h, 38, 10, 'e', 'upp_smiths');
  door(h, 9, 18, 'n', 'upp_int_runehall');
  talkTo(h, 'solvi');
  expect(h.sim.state.flags.st_eldr_learned).toBe(true);
  expect(h.sim.state.inv.galdr).toEqual(['eldr']);
  door(h, 19, 15, 's', 'upp_smiths');

  // Out of town to the first leaves on the north road, and sing.
  leave(h, 1, 10, 'w', 'upp_square');
  leave(h, 19, 20, 's', 'upp_gate');
  leave(h, 19, 20, 's', 'myr_north');
  walkFighting(h, 9, 10);
  face(h, 's');
  const seidr = h.sim.state.hero.seidr;
  h.press(['galdr']).idle(40);
  expect(h.sim.state.hero.seidr).toBeLessThan(seidr);
  expect(h.sim.screen.cover.burning).toBeGreaterThan(0);
  h.idle(240);
  alive(h);
  return h;
}

describe('M2b route', () => {
  it('walks from Önundr to Uppvík, learns Eldr from Sölvi and burns the first leaves', () => {
    const h = playM2b(5);
    const c = h.sim.state.clock;
    console.log(
      `M2b route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)} ${String(Math.floor(c.minute / 60))}:${String(c.minute % 60).padStart(2, '0')}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}, silver ${String(h.sim.state.hero.silver)}`,
    );
  }, 120_000);

  it('replays identically', () => {
    expect(playM2b(9).sim.hash()).toBe(playM2b(9).sim.hash());
  }, 240_000);
});
