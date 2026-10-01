import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { TILE } from '@core/world/dims';
import { tileFeet } from '@core/world/screen';
import type { ScreenId } from '@content/world/screens';
import { Harness, frameOf } from './harness';
import { crossTo, face, finishStory, heroTile, talkTo, walkTo } from './walk';

const preset = DEV_PRESETS.hau;

function hau(): Harness {
  return new Harness({ preset });
}

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

const wights = (h: Harness) => h.sim.enemies.filter((e) => e.def === 'haugbui');

describe('the way into Haugar', () => {
  it('is shut by the rockfall until a bomb opens it, and past it Ask has reached Haugar', () => {
    const h = hau();
    crossTo(h, 'e', 'hau_gully');
    walkTo(h, 5, 17);
    face(h, 'e');
    h.hold(['right'], 40);
    expect(heroTile(h.sim)[0]).toBe(5);
    h.press(['item1']);
    walkTo(h, 1, 17);
    h.idle(120);
    expect(h.sim.state.world.opened).toContain('hau_k_gully');
    h.until((s) => s.mode === 'story', 300, frameOf(['right']));
    finishStory(h);
    expect(h.sim.state.flags.st_haugar_reached).toBe(true);
    h.expectAnims();
  });
});

describe('Styrr', () => {
  it('tells of the barrow-watch and teaches the dash thrust for silver', () => {
    const h = warp(hau(), 'hau_int_styrr', 19, 13);
    talkTo(h, 'styrr');
    const f = h.sim.state.flags;
    expect(f.n_styrr_met).toBe(true);
    expect(f.q_rs3_watch).toBe(true);
    expect(f.t_dash).toBe(true);
    expect(h.sim.state.hero.silver).toBe(100);
    h.expectAnims();
  });

  it('waits with Ask for nightfall once the lessons are paid for', () => {
    const h = hau();
    Object.assign(h.sim.state.flags, { n_styrr_met: true, q_rs3_watch: true, t_dash: true, t_parry: true });
    warp(h, 'hau_int_styrr', 19, 13);
    talkTo(h, 'styrr');
    expect(h.sim.state.clock.minute).toBeGreaterThanOrEqual(22 * 60);
  });
});

describe('the barrow-watch', () => {
  const night = (watch: boolean): Harness => {
    const h = hau();
    h.sim.state.clock.minute = 23 * 60;
    if (watch) h.sim.state.flags.q_rs3_watch = true;
    return warp(h, 'hau_king', 20, 19);
  };

  it('raises nothing without Styrr’s word, and the door stays shut', () => {
    const h = night(false);
    expect(wights(h)).toHaveLength(0);
    expect(h.sim.actors.find((a) => a.def === 'gate')?.anim).toBe('closed');
  });

  it('raises three wights at night; beating them opens the King’s Barrow for good', () => {
    const h = night(true);
    expect(wights(h)).toHaveLength(3);
    h.sim.command({ t: 'killAll' });
    h.idle(2);
    expect(h.sim.state.flags.q_watch_kills).toBe(3);
    expect(h.sim.mode).toBe('story');
    finishStory(h);
    expect(h.sim.state.flags.st_barrow_open).toBe(true);
    const door = h.sim.actors.filter((a) => a.def === 'gate');
    expect(door.map((d) => d.anim)).toEqual(['open', 'open']);
    // The door's tiles are open ground now.
    const g = h.sim.screen.collision;
    expect((g.flags[10 * g.cols + 19] ?? 1) & 1).toBe(0);
    // And no more wights rise for the watch.
    warp(h, 'hau_king', 20, 19);
    expect(wights(h)).toHaveLength(0);
    expect(h.sim.hero.pos.y).toBeGreaterThan(18 * TILE);
  });
});
