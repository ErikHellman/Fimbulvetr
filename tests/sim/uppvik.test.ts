import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { SOLID } from '@core/world/collision';
import { Harness } from './harness';
import { finishStory, talkTo } from './walk';

const solid = (h: Harness, x: number, y: number): boolean =>
  ((h.sim.screen.collision.flags[y * 40 + x] ?? 0) & SOLID) !== 0;

describe('the road north', () => {
  it('stays under the fallen pine until Önundr saws it through, after the first stone is lit', () => {
    const shut = new Harness({ preset: DEV_PRESETS.myr, screen: 'myr_deep', tile: [20, 5] });
    expect(solid(shut, 19, 2)).toBe(true);
    const h = new Harness({ preset: DEV_PRESETS.north });
    talkTo(h, 'onundr');
    finishStory(h);
    expect(h.sim.state.flags.st_road_open).toBe(true);
    h.sim.command({ t: 'warp', screen: 'myr_deep', x: 20 * 16 + 8, y: 5 * 16 + 14 });
    h.idle(2);
    expect(solid(h, 19, 2)).toBe(false);
  });
});
