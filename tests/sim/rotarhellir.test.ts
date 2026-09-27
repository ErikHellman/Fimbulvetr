import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { dungeonOf } from '@core/state/dungeons';
import { Harness } from './harness';
import { crossTo, finishStory, walkTo } from './walk';

describe('Rótarhellir', () => {
  it('opens under the roots: through the cave mouth, a first word, and the way back out', () => {
    const h = new Harness({ preset: DEV_PRESETS.myr });
    h.sim.command({ t: 'warp', screen: 'myr_roots', x: 19 * 16 + 8, y: 5 * 16 + 14 });
    h.idle(1);
    walkTo(h, 19, 3);
    crossTo(h, 'n', 'd1_r01');
    h.until((s) => s.mode === 'story', 60);
    finishStory(h);
    expect(h.sim.state.flags.st_d1_entered).toBe(true);
    expect(h.sim.weather()).toBe('clear');
    const minute = h.sim.state.clock.minute;
    h.idle(600);
    expect(h.sim.state.clock.minute).toBe(minute);
    crossTo(h, 's', 'myr_roots');
    expect(h.sim.hero.facing).toBe('s');
    h.expectAnims();
  });

  it('slides from room to room on its own grid', () => {
    const h = new Harness({ preset: DEV_PRESETS.d1 });
    h.sim.command({ t: 'god', on: true });
    walkTo(h, 19, 2);
    crossTo(h, 'n', 'd1_r04');
    walkTo(h, 37, 10);
    crossTo(h, 'e', 'd1_r06');
    expect(h.sim.screen.neighbours).toMatchObject({ s: 'd1_r03', w: 'd1_r04', n: 'd1_r08' });
    h.expectAnims();
  });

  it('bars the lair with lock A until a key is spent, then it stands open from both sides', () => {
    const h = new Harness({ preset: DEV_PRESETS.d1 });
    walkTo(h, 19, 2);
    crossTo(h, 'n', 'd1_r04');
    walkTo(h, 19, 1);
    h.hold(['up'], 30);
    expect(h.sim.screen.id).toBe('d1_r04');
    dungeonOf(h.sim.state, 'd1').keys = 1;
    h.hold(['up'], 5);
    crossTo(h, 'n', 'd1_r11');
    expect(dungeonOf(h.sim.state, 'd1')).toMatchObject({ keys: 0, doors: ['d1_lock_a'] });
    expect(h.sim.actors.filter((a) => a.def === 'lock').every((a) => a.anim === 'open')).toBe(true);
    // The far side of the boomerang shutter stays shut from here.
    expect(
      h.sim.actors.filter((a) => a.def === 'shutter' && a.mem['tx'] === 0).every((a) => a.anim === 'closed'),
    ).toBe(true);
    h.expectAnims();
  });
});
