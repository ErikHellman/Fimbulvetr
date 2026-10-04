import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
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
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_barrow_ring');
const sleepers = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'enemy' && a.mem['asleep'] === 1);
const wights = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'enemy' && a.def === 'haugbui');

describe('Geirmundr’s grave-ring (q_barrow_ring)', () => {
  it('is laid back on its mound at night; three wights rise, and Geirmundr gives a second quiver', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul });
    Object.assign(h.sim.state.flags, { st_home_winter: true, n_geirmundr_met: true });
    warp(h, 'hau_barrows', 14, 20);
    talkTo(h, 'geirmundr');
    expect(h.sim.state.inv.items.grave_ring).toBe(1);
    expect(quest(h)?.done).toBe(false);

    // By day the mound is only a mound.
    interactNorth(h, 3, 3);
    expect(h.sim.mode).toBe('play');

    h.sim.state.clock.minute = 23 * 60;
    warp(h, 'hau_barrows', 3, 6);
    expect(sleepers(h)).toHaveLength(3);
    interactNorth(h, 3, 3);
    expect(h.sim.mode).toBe('story');
    finishStory(h);
    expect(h.sim.state.inv.items.grave_ring ?? 0).toBe(0);
    expect(h.sim.state.flags.q_ring_laid).toBe(true);
    expect(sleepers(h)).toHaveLength(0);
    expect(wights(h).length).toBeGreaterThanOrEqual(3);

    h.sim.state.clock.minute = 12 * 60;
    warp(h, 'hau_barrows', 14, 20);
    const quivers = h.sim.state.inv.items.quiver ?? 0;
    talkTo(h, 'geirmundr');
    expect(h.sim.state.inv.items.quiver).toBe(quivers + 1);
    expect(h.sim.state.flags.q_barrow_ring_done).toBe(true);
    expect(quest(h)?.done).toBe(true);
  });
});
