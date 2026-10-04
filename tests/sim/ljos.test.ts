import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import type { ScreenId } from '@content/world/screens';
import { tileFeet } from '@core/world/screen';
import { LJOS } from '@core/sim/systems/ljos';
import { Harness, frameOf } from './harness';
import { face, finishStory, interactNorth, walkTo } from './walk';

/** Ask in Niflmýrr's fog at `minute`, Ljós known and the bar full. */
function singer(screen: 'nif_causeway' | 'nif_deadwood', tile: [number, number], minute = 12 * 60): Harness {
  const h = new Harness({ preset: DEV_PRESETS.fimbul, screen, tile, minute, season: 'summer' });
  h.sim.state.inv.galdr = ['ljos'];
  h.sim.state.hero.seidr = 10;
  return h;
}

describe('Ljós, the light-song', () => {
  it('costs 2 seiðr and burns the fog off for twenty seconds', () => {
    const h = singer('nif_causeway', [18, 16]);
    expect(h.sim.fog().amount).toBeGreaterThan(0);
    h.press(['galdr']).idle(2);
    expect(h.sim.state.hero.seidr).toBe(8);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_ljos' });
    expect(h.sim.fog().amount).toBe(0);
    h.idle(LJOS.ticks - 40);
    expect(h.sim.fog().amount).toBe(0);
    h.idle(60);
    expect(h.sim.fog().amount).toBeGreaterThan(0);
  });

  it('lights the night round Ask, wider than the lantern', () => {
    const h = singer('nif_causeway', [18, 16], 23 * 60);
    h.press(['galdr']).idle(2);
    const mine = h.sim.lights().filter((l) => l.hero === true);
    expect(Math.max(...mine.map((l) => l.r))).toBe(LJOS.radius);
  });

  it('shows the drowned path to the dead wood’s islet, and the heart piece on it', () => {
    const h = singer('nif_deadwood', [8, 14]);
    h.sim.state.inv.items = Object.fromEntries(
      Object.entries(h.sim.state.inv.items).filter(([id]) => id !== 'lantern'),
    );
    expect(h.sim.ghosts()).toEqual([]);
    h.press(['galdr']).idle(2);
    expect(h.sim.ghosts()).toContainEqual({ x: 8, y: 12 });
    expect(h.sim.ghosts()).toContainEqual({ x: 8, y: 9 });
    walkTo(h, 8, 7);
    walkTo(h, 7, 5);
    walkTo(h, 8, 4);
    expect(h.sim.state.world.pieces).toContain('hp_nif_deadwood');
  });

  it('drags a hidden mara into the open, however far off', () => {
    const open = Array.from({ length: 22 }, (_, y) =>
      y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
    );
    const things: Thing[] = [{ k: 'enemy', id: 'mara', at: { x: 34, y: 10 } }];
    const db: ContentDb = {
      ...DB,
      screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map: open, things } },
    };
    const h = new Harness({ db, tile: [6, 10], facing: 'e' });
    h.sim.state.inv.galdr = ['ljos'];
    h.sim.state.hero.seidr = 10;
    h.idle(30);
    expect(h.sim.enemies[0]?.fsm.s).toBe('drift');
    h.press(['galdr']).idle(4);
    expect(h.sim.enemies[0]?.fsm.s).not.toBe('drift');
  });
});

/** Heiðr stands behind her table: talk to her from her side. */
function talkToHeidr(h: Harness): void {
  walkTo(h, 21, 11);
  face(h, 'e');
  h.step(frameOf([], ['interact']));
  expect(h.sim.mode).toBe('story');
  finishStory(h);
}

/** Warps within the current harness. */
function warp(h: Harness, screen: ScreenId, x: number, y: number): void {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  h.idle(2);
}

describe('Heiðr’s embers (q_ljos)', () => {
  it('three wisp embers caught at night in Niflmýrr buy the light-song from Heiðr', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul, minute: 23 * 60, season: 'summer' });
    Object.assign(h.sim.state.flags, { n_heidr_met: true, st_rime_open: true, st_niflmyrr_reached: true });
    warp(h, 'myr_int_volva', 22, 14);
    talkToHeidr(h);
    expect(h.sim.state.flags.q_ljos_asked).toBe(true);
    for (const [screen, x, y] of [
      ['nif_jars', 10, 16],
      ['nif_causeway', 15, 13],
      ['nif_strand', 34, 8],
    ] as const) {
      warp(h, screen, x, y + 2);
      expect(
        h.sim.actors.some((a) => a.kind === 'prop' && a.def === 'wisp_ember'),
        screen,
      ).toBe(true);
      interactNorth(h, x, y);
      h.idle(10);
      expect(
        h.sim.actors.some((a) => a.kind === 'prop' && a.def === 'wisp_ember'),
        screen,
      ).toBe(false);
    }
    expect(h.sim.state.inv.items.wisp_ember).toBe(3);
    warp(h, 'myr_int_volva', 22, 14);
    talkToHeidr(h);
    expect(h.sim.state.inv.galdr).toContain('ljos');
    expect(h.sim.state.inv.items.wisp_ember ?? 0).toBe(0);
    expect(h.sim.state.flags.q_ljos_done).toBe(true);
  });

  it('no ember burns by day, or before Heiðr asks', () => {
    const day = new Harness({
      preset: DEV_PRESETS.fimbul,
      screen: 'nif_jars',
      tile: [10, 18],
      minute: 12 * 60,
    });
    day.sim.state.flags.q_ljos_asked = true;
    warp(day, 'nif_jars', 10, 18);
    expect(day.sim.actors.some((a) => a.def === 'wisp_ember')).toBe(false);
    const unasked = new Harness({
      preset: DEV_PRESETS.fimbul,
      screen: 'nif_jars',
      tile: [10, 18],
      minute: 23 * 60,
    });
    expect(unasked.sim.actors.some((a) => a.def === 'wisp_ember')).toBe(false);
  });
});
