import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { Season } from '@core/clock/types';
import type { ScreenId } from '@content/world/screens';
import { questLog } from '@core/story/quests';
import { tileFeet } from '@core/world/screen';
import { Harness } from './harness';
import { finishStory, interactNorth, talkTo } from './walk';

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

const quest = (h: Harness) =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_amber');
const amber = (h: Harness) => h.sim.state.inv.items.amber ?? 0;

/** The three places in Mýrland: the cut reeds, the peat bank and the warm springs' mud. */
const SITES: readonly [ScreenId, number, number][] = [
  ['myl_reeds', 8, 6],
  ['myl_peat', 8, 16],
  ['myl_springs', 11, 5],
];

function search(h: Harness, [screen, x, y]: readonly [ScreenId, number, number]): Harness {
  warp(h, screen, x, y + 2);
  interactNorth(h, x, y);
  return finishStory(h);
}

/** After the pass in `season`, Ragna has asked. */
function asked(season: Season): Harness {
  const h = new Harness({ preset: DEV_PRESETS.fimbul, season, minute: 12 * 60 });
  Object.assign(h.sim.state.flags, { st_home_winter: true, n_ragna_met: true, q_amber_asked: true });
  return h;
}

describe('Ragna’s amber (q_amber)', () => {
  it('is asked for by the shore in Uppvík once the pass is open', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul, minute: 12 * 60 });
    Object.assign(h.sim.state.flags, { st_home_winter: true, n_ragna_met: true });
    warp(h, 'upp_smiths', 20, 14);
    talkTo(h, 'ragna');
    expect(h.sim.state.flags.q_amber_asked).toBe(true);
    expect(quest(h)?.done).toBe(false);
  });

  it('finds nothing before Ragna asks', () => {
    const h = asked('spring');
    h.sim.state.flags.q_amber_asked = false;
    for (const site of SITES) search(h, site);
    expect(amber(h)).toBe(0);
  });

  it('finds a lump at each place once, the spring mud only in spring', () => {
    const h = asked('winter');
    for (const site of SITES) search(h, site);
    expect(amber(h)).toBe(2);
    for (const site of SITES) search(h, site);
    expect(amber(h)).toBe(2);
    const s = asked('spring');
    const mud = SITES[2];
    if (mud !== undefined) search(s, mud);
    expect(amber(s)).toBe(1);
  });

  it('earns the arm-ring of thrift for three', () => {
    const h = asked('spring');
    for (const site of SITES) search(h, site);
    expect(amber(h)).toBe(3);
    warp(h, 'upp_smiths', 20, 14);
    talkTo(h, 'ragna');
    expect(amber(h)).toBe(0);
    expect(h.sim.state.flags.w_ring_thrift).toBe(true);
    expect(quest(h)?.done).toBe(true);
  });
});
