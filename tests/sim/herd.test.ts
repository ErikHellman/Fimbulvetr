import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import { TILE } from '@core/world/dims';
import { tileFeet } from '@core/world/screen';
import { HERD_TICKS } from '@content/scripts/lowlands';
import { Harness } from './harness';
import { finishStory, herdInto, talkTo } from './walk';

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

/** On the heath after the pass, Hildr met; the herding asked for and begun. */
function begun(): Harness {
  const h = new Harness({ preset: DEV_PRESETS.fimbul });
  Object.assign(h.sim.state.flags, { st_home_winter: true, n_hildr_met: true });
  warp(h, 'hau_heath', 17, 12);
  // Reading on runs through the start: the fade, the flock scattered, and the sand turned.
  talkTo(h, 'hildr');
  expect(h.sim.mode).toBe('play');
  expect(h.sim.trial()).not.toBeNull();
  return h;
}

const PEN = { x: 19 * TILE, y: 17 * TILE };
const free = (h: Harness) =>
  h.sim.actors.filter((a) => a.kind === 'critter' && a.mem['tag'] !== undefined && a.mem['penned'] !== 1);

describe('Hildr’s scattered flock (q_herd)', () => {
  it('scatters six of her sheep over the heath once the pass is open', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul });
    warp(h, 'hau_heath', 17, 12);
    expect(free(h)).toHaveLength(6);
  });

  it('runs the sand for a minute; six sheep in the hurdles win a piece of heart', () => {
    const h = begun();
    expect(h.sim.trial()?.of).toBe(HERD_TICKS);
    const before = h.sim.state.world.pieces.length;
    herdInto(h, PEN, () => h.sim.mode !== 'play', HERD_TICKS);
    expect(h.sim.mode).toBe('story');
    finishStory(h);
    expect(h.sim.state.flags.q_herd_done).toBe(true);
    expect(h.sim.state.world.pieces).toContain('hp_hau_heath');
    expect(h.sim.state.world.pieces.length).toBe(before + 1);
    // The flock stays penned.
    warp(h, 'hau_heath', 17, 12);
    expect(free(h)).toHaveLength(0);
  }, 60_000);

  it('lets the sand run out, and Hildr will try again', () => {
    const h = begun();
    h.idle(HERD_TICKS);
    expect(h.sim.mode).toBe('story');
    finishStory(h);
    expect(h.sim.state.flags.q_herd_done).not.toBe(true);
    expect(h.sim.trial()).toBeNull();
    talkTo(h, 'hildr');
    expect(h.sim.trial()).not.toBeNull();
  });
});
