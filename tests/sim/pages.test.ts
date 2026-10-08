import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import { questLog } from '@core/story/quests';
import { tileFeet } from '@core/world/screen';
import { Harness, frameOf } from './harness';
import { face, finishStory, interactNorth, talkTo, walkTo } from './walk';

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

/** Opens the chest at (tx, ty) from the tile below it. */
function open(h: Harness, screen: ScreenId, tx: number, ty: number): void {
  warp(h, screen, tx, ty + 2);
  interactNorth(h, tx, ty);
  finishStory(h);
}

const pages = (h: Harness) =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_pages');
const leaves = (h: Harness) => h.sim.state.inv.items.rune_leaf ?? 0;

describe('Gyða’s lost leaves (q_pages)', () => {
  it('finds a leaf in each lowland region, behind an eye, the drifts, a crack and the dark', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul });
    Object.assign(h.sim.state.flags, { st_home_winter: true, st_blood_told: true });
    expect(pages(h)?.done).toBe(false);

    // Askdalr: an eye carved on the ridge opens to an arrow, and a chest appears.
    open(h, 'ask_ridge', 6, 5);
    expect(leaves(h)).toBe(0);
    walkTo(h, 4, 7);
    face(h, 'n');
    h.sim.state.inv.slots = ['bow', 'bombs'];
    h.step(frameOf([], ['item1'])).idle(40);
    expect(h.sim.state.flags.w_ask_leaf_eye).toBe(true);
    open(h, 'ask_ridge', 6, 5);
    expect(leaves(h)).toBe(1);

    open(h, 'myr_deep', 11, 7);
    open(h, 'myl_int_cave', 24, 11);
    open(h, 'hau_int_cairn', 22, 11);
    expect(leaves(h)).toBe(4);

    const seidr = h.sim.state.hero.maxSeidr;
    warp(h, 'ask_int_hof', 20, 14);
    talkTo(h, 'gyda');
    expect(leaves(h)).toBe(0);
    expect(h.sim.state.flags.q_pages_done).toBe(true);
    expect(h.sim.state.hero.maxSeidr).toBe(seidr + 5);
    expect(pages(h)?.done).toBe(true);
  });

  it('hides the leaves until Gyða has told of them', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul });
    open(h, 'hau_int_cairn', 22, 11);
    expect(leaves(h)).toBe(0);
  });
});
