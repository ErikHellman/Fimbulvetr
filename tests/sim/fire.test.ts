import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { TUNING } from '@content/tuning';
import type { ContentDb } from '@core/sim/db';
import { ignite } from '@core/sim/systems/fire';
import type { Thing } from '@core/world/screen';
import { coverAt } from '@core/world/cover';
import { Harness } from './harness';

/** test_a as a summer meadow of tall grass on rows 4–16, open ground elsewhere. */
function meadow(things: Thing[] = []): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    return '#' + (y >= 4 && y <= 16 ? '"' : '.').repeat(38) + '#';
  });
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

const standing = (h: Harness, x: number, y: number) => coverAt(h.sim.screen.cover, DB.coverOrder, x, y);
const burning = (h: Harness, x: number, y: number) => (h.sim.screen.cover.burn[y * 40 + x] ?? 0) > 0;
const burnt = (h: Harness) => Array.from(h.sim.screen.cover.cleared).filter((c) => c === 1).length;

function lit(weather: 'wind' | 'rain' | null, at: readonly [number, number] = [20, 10]): Harness {
  const h = new Harness({ db: meadow(), tile: [5, 19], season: 'summer' });
  if (weather !== null) h.sim.command({ t: 'weather', kind: weather });
  h.idle(1);
  expect(ignite(h.sim, at[0], at[1])).toBe(true);
  return h;
}

describe('fire', () => {
  it('burns a tile of tall grass down to stubble, and the burn is saved', () => {
    const h = lit('rain');
    expect(burning(h, 20, 10)).toBe(true);
    h.idle(TUNING.fire.burnTicks + 2);
    expect(burning(h, 20, 10)).toBe(false);
    expect(standing(h, 20, 10)).toBeNull();
    expect(h.sim.state.world.cover.test_a?.cleared).toMatch(/[1-9a-f]/);
  });

  it('never catches on bare ground, or twice on the same tile', () => {
    const h = lit(null);
    expect(ignite(h.sim, 20, 10)).toBe(false);
    expect(ignite(h.sim, 20, 19)).toBe(false);
  });

  it('does not spread in the rain', () => {
    const h = lit('rain');
    h.idle(TUNING.fire.burnTicks * 4);
    expect(burnt(h)).toBe(1);
  });

  it('runs downwind through the grass in a wind', () => {
    const h = lit('wind');
    const w = h.sim.wind();
    h.idle(TUNING.fire.burnTicks * 8);
    const g = h.sim.screen.cover;
    let down = 0;
    let up = 0;
    for (let y = 4; y <= 16; y++)
      for (let x = 1; x < 39; x++) {
        if (g.cleared[y * 40 + x] !== 1) continue;
        const along = (x - 20) * w.x + (y - 10) * w.y;
        if (along > 0) down += 1;
        if (along < 0) up += 1;
      }
    expect(down).toBeGreaterThan(3);
    expect(down).toBeGreaterThan(up * 2);
  });

  it('creeps out a little in calm air too, and the same way for the same seed', () => {
    const a = lit(null);
    const b = lit(null);
    a.idle(TUNING.fire.burnTicks * 4);
    b.idle(TUNING.fire.burnTicks * 4);
    expect(burnt(a)).toBeGreaterThan(1);
    expect(Array.from(a.sim.screen.cover.cleared)).toEqual(Array.from(b.sim.screen.cover.cleared));
  });

  it('hurts Ask standing in it, and foes', () => {
    const h = new Harness({
      db: meadow([{ k: 'enemy', id: 'vargr', at: { x: 30, y: 10 } }]),
      tile: [20, 10],
    });
    h.sim.command({ t: 'weather', kind: 'rain' });
    h.idle(1);
    const hp = h.sim.hero.hp;
    ignite(h.sim, 20, 10);
    const wolf = h.sim.actors.find((a) => a.def === 'vargr');
    if (wolf === undefined) throw new Error('no vargr');
    wolf.pos = { x: 30 * 16 + 8, y: 10 * 16 + 14 };
    ignite(h.sim, 30, 10);
    h.idle(4);
    expect(h.sim.hero.hp).toBeLessThan(hp);
    expect(wolf.hp).toBeLessThan(wolf.maxHp);
  });

  it('shows in the hash only while something burns', () => {
    const h = new Harness({ db: meadow(), tile: [5, 19] });
    const a = new Harness({ db: meadow(), tile: [5, 19] });
    expect(h.sim.hash()).toBe(a.sim.hash());
    ignite(h.sim, 20, 10);
    expect(h.sim.hash()).not.toBe(a.sim.hash());
  });
});
