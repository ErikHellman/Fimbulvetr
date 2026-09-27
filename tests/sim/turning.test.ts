import { describe, expect, it } from 'vitest';
import { CLOCK_RULES } from '@content/clock';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import { coverAt } from '@core/world/cover';
import { Harness } from './harness';

/**
 * M2a's exit: Myrkviðr turning with the world, rolling on. Winter nights bring rolled foes (twice as many
 * as by day) and forest trolls that the sunrise turns to stone; the weather changes from day to day; snow
 * lies over the ground and slows Ask until the sword clears it.
 */
const SCREENS: readonly ScreenId[] = ['myr_road', 'myr_pines', 'myr_hollow', 'myr_clearing', 'myr_deep'];
const sunrise = CLOCK_RULES.sunrise.winter;

function start(): Harness {
  const h = new Harness({ preset: DEV_PRESETS.turning, rolled: true });
  h.sim.command({ t: 'god', on: true });
  h.idle(1);
  return h;
}

const warp = (h: Harness, screen: ScreenId, minute: number): void => {
  h.sim.command({ t: 'setMinute', minute });
  h.sim.command({ t: 'warp', screen, x: 20 * 16 + 8, y: 18 * 16 + 14 });
  h.idle(1);
};
const rolled = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'enemy' && a.mem['rolled'] === 1);

describe('the turning world (M2a exit)', () => {
  it('brings twice the foes by night, and forest trolls the sunrise turns to stone', () => {
    const h = start();
    let byDay = 0;
    let byNight = 0;
    let trolls = 0;
    let stones = 0;
    for (let day = 2; day <= 4; day++) {
      h.sim.state.clock.day = day;
      for (const screen of SCREENS) {
        warp(h, screen, 12 * 60);
        byDay += rolled(h).length;
        expect(rolled(h).every((e) => e.def === 'vargr')).toBe(true);
        warp(h, screen, sunrise - 1);
        byNight += rolled(h).length;
        const here = rolled(h).filter((e) => e.def === 'forest_troll').length;
        trolls += here;
        // The minute runs out: sunrise.
        h.until((s) => s.state.clock.minute === sunrise, 70);
        h.idle(1).expectAnims();
        expect(h.sim.actors.filter((a) => a.def === 'forest_troll')).toHaveLength(0);
        stones += h.sim.actors.filter((a) => a.def === 'troll_stone').length;
        expect(h.sim.mode).not.toBe('over');
      }
    }
    expect(byNight).toBeGreaterThan(byDay);
    expect(trolls).toBeGreaterThan(0);
    expect(stones).toBe(trolls);
  });

  it('changes the weather from day to day, the same for the same seed', () => {
    const h = start();
    const kinds = new Set<string>();
    const days: string[] = [];
    for (let day = 1; day <= 12; day++) {
      h.sim.state.clock.day = day;
      days.push(h.sim.weather());
      kinds.add(h.sim.weather());
    }
    expect(kinds.size).toBeGreaterThanOrEqual(3);
    const again = start();
    expect(
      Array.from({ length: 12 }, (_, i) => {
        again.sim.state.clock.day = i + 1;
        return again.sim.weather();
      }),
    ).toEqual(days);
  });

  it('lays snow over Myrkviðr in winter that slows Ask, until the sword clears a path', () => {
    const h = start();
    warp(h, 'myr_deep', 12 * 60);
    const cover = (x: number, y: number) => coverAt(h.sim.screen.cover, h.sim.db.coverOrder, x, y);
    expect(cover(10, 12)).toBe('snow');
    expect(cover(10, 7)).toBe('drift');
    h.sim.hero.facing = 'n';
    h.press(['sword']).idle(20);
    const [hx, hy] = [Math.floor(h.sim.hero.pos.x / 16), Math.floor((h.sim.hero.pos.y - 1) / 16)];
    expect(cover(hx, hy - 1)).toBeNull();
  });
});
