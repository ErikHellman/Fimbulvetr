import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import { AXES_TICKS } from '@content/scripts/lowlands';
import { questLog } from '@core/story/quests';
import { TILE } from '@core/world/dims';
import { tileFeet } from '@core/world/screen';
import { Harness, frameOf } from './harness';
import { face, finishStory, interactNorth, talkTo, walkTo } from './walk';

const quest = (h: Harness) =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_axes');
const axes = (h: Harness) =>
  h.sim.actors.filter((a) => a.kind === 'prop' && a.def === 'axe' && a.mem['carried'] !== 1);

/** At Ketill's range after the pass, the throwing begun. */
function begun(): Harness {
  const h = new Harness({ preset: DEV_PRESETS.fimbul });
  Object.assign(h.sim.state.flags, { st_home_winter: true, n_ketill_met: true });
  const p = tileFeet({ x: 16, y: 10 });
  h.sim.command({ t: 'warp', screen: 'upp_smiths', x: p.x, y: p.y });
  h.idle(2);
  talkTo(h, 'ketill');
  expect(h.sim.trial()?.of).toBe(AXES_TICKS);
  return h;
}

/** Lifts the nearest axe still on the rack, walks to (tx, ty) facing east and throws it on the move. */
function throwAt(h: Harness, tx: number, ty: number): void {
  const axe = axes(h)
    .filter((a) => a.pos.x < 13 * TILE)
    .sort(
      (a, b) =>
        Math.abs(a.pos.x - h.sim.hero.pos.x) +
        Math.abs(a.pos.y - h.sim.hero.pos.y) -
        (Math.abs(b.pos.x - h.sim.hero.pos.x) + Math.abs(b.pos.y - h.sim.hero.pos.y)),
    )[0];
  if (axe === undefined) throw new Error('no axe left');
  const ax = Math.floor(axe.pos.x / TILE);
  const ay = Math.floor((axe.pos.y - 1) / TILE);
  interactNorth(h, ax, ay);
  h.idle(16);
  expect(h.sim.hero.fsm.s).toBe('carry');
  walkTo(h, tx, ty);
  face(h, 'e');
  h.step(frameOf(['right'], ['interact'])).idle(30);
}

describe('Ketill’s axe range (q_axes)', () => {
  it('hits five targets with thrown axes before the sand runs out, for a piece of heart', () => {
    const h = begun();
    for (const [tx, ty] of [
      [13, 18],
      [13, 20],
      [18, 18],
      [18, 20],
      [21, 20],
    ] as const) {
      throwAt(h, tx, ty);
      if (h.sim.mode !== 'play') break;
    }
    expect(h.sim.state.flags.q_axes_hit).toBe(5);
    h.until((sim) => sim.mode === 'story', 10);
    finishStory(h);
    expect(h.sim.state.flags.q_axes_done).toBe(true);
    expect(h.sim.state.world.pieces).toContain('hp_upp_range');
    expect(quest(h)?.done).toBe(true);
  }, 60_000);

  it('counts each target once', () => {
    const h = begun();
    throwAt(h, 13, 18);
    throwAt(h, 13, 18);
    expect(h.sim.state.flags.q_axes_hit).toBe(1);
  });

  it('lets the sand run out, and Ketill offers another go', () => {
    const h = begun();
    h.idle(AXES_TICKS);
    finishStory(h);
    expect(h.sim.state.flags.q_axes_done).not.toBe(true);
    talkTo(h, 'ketill');
    expect(h.sim.trial()).not.toBeNull();
  });
});
