import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import { tileFeet } from '@core/world/screen';
import { Harness, frameOf } from './harness';
import { finishStory, heroTile, walkTo } from './walk';

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

/** Where M4 leaves Ask (the third stone lit), at the foot of the pass. */
function atThePass(): Harness {
  return warp(new Harness({ preset: DEV_PRESETS.haubow }), 'hau_pass', 20, 12);
}

const gates = (h: Harness) => h.sim.actors.filter((a) => a.def === 'gate');

describe('the runestone pass', () => {
  it('stays shut, and nothing happens at the door, before the third stone burns', () => {
    const h = new Harness({ preset: DEV_PRESETS.haubow });
    h.sim.state.flags.st_stone3_lit = false;
    warp(h, 'hau_pass', 20, 12);
    walkTo(h, 20, 5);
    expect(h.sim.mode).toBe('play');
    expect(h.sim.state.flags.st_pass_open).not.toBe(true);
  });

  it('opens with three stones lit: the breath, the Fimbulvetr, the credits, and the gorge iced shut', () => {
    const h = atThePass();
    expect(h.sim.state.clock.season).toBe('autumn');
    h.until((s) => s.mode === 'story', 400, frameOf(['up']));
    const seen = new Set<string>();
    for (let i = 0; i < 6000 && h.sim.mode !== 'play'; i += 4) {
      const ui = h.sim.storyUi();
      if (ui !== null) seen.add(ui.k);
      // Read the lines, but let the breath and the credits run a while before skipping.
      const k = ui?.k === 'credits' && ui.t < 200 ? [] : (['confirm'] as const);
      h.step(frameOf([], [...k])).idle(3);
    }
    finishStory(h);
    expect(seen).toContain('breath');
    expect(seen).toContain('credits');
    expect(seen).toContain('card');
    expect(h.events.filter((e) => e.t === 'sfx' && e.id === 'sfx_seal')).toHaveLength(3);
    expect(h.sim.state.flags.st_pass_open).toBe(true);
    expect(h.sim.state.clock.season).toBe('winter');
    expect(h.events.some((e) => e.t === 'autosave')).toBe(true);
    // The door is open; the rime wall beyond it is not.
    const door = gates(h).filter((g) => g.art === 'fix_slab');
    expect(door.map((d) => d.anim)).toEqual(['open', 'open', 'open', 'open']);
    const rime = gates(h).filter((g) => g.art === 'fix_rime');
    expect(rime.map((d) => d.anim)).toEqual(['closed', 'closed', 'closed', 'closed']);
    // Up the gorge as far as the ice, and no further.
    h.until((s) => heroTile(s)[1] <= 2, 200, frameOf(['up']));
    h.hold(['up'], 60);
    expect(heroTile(h.sim)[1]).toBe(2);
    h.expectAnims();
  });

  it('does not open twice', () => {
    const h = new Harness({ preset: DEV_PRESETS.haubow });
    h.sim.state.flags.st_pass_open = true;
    warp(h, 'hau_pass', 20, 12);
    walkTo(h, 20, 5);
    expect(h.sim.mode).toBe('play');
  });
});
