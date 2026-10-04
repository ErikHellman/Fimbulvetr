import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import { questLog } from '@core/story/quests';
import { tileFeet } from '@core/world/screen';
import { Harness } from './harness';
import { talkTo } from './walk';

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

/** Home after the pass, the homecoming seen and Gyða heard; `silver` in a purse of 300. */
function home(silver: number): Harness {
  const h = new Harness({ preset: DEV_PRESETS.fimbul });
  Object.assign(h.sim.state.flags, { st_pass_open: true, st_home_winter: true, st_blood_told: true });
  h.sim.state.hero.purse = 1;
  h.sim.state.hero.silver = silver;
  return h;
}

const npcOn = (h: Harness, id: string) => h.sim.actors.some((a) => a.kind === 'npc' && a.def === id);
const sheep = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'critter' && a.def === 'sheep').length;
const farm = (h: Harness) =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_farm');

describe('rebuilding the farm, stages 1–2', () => {
  it('starts from Halvar’s bed once Ask is home in the Fimbulvetr', () => {
    const h = home(0);
    expect(farm(h)).toBeUndefined();
    warp(h, 'ask_int_longhouse', 27, 12);
    talkTo(h, 'halvar');
    expect(h.sim.state.flags.st_farm_asked).toBe(true);
    expect(farm(h)?.done).toBe(false);
    expect(h.sim.state.flags.q_farm ?? 0).toBe(0);
  });

  it('turfs the longhouse roof for 150 silver, and Halvar gets up and works the yard by day', () => {
    const h = home(400);
    h.sim.state.flags.st_farm_asked = true;
    warp(h, 'ask_int_longhouse', 27, 12);
    talkTo(h, 'halvar');
    expect(h.sim.state.flags.q_farm).toBe(1);
    expect(h.sim.state.hero.silver).toBe(250);
    warp(h, 'ask_farmyard', 20, 18);
    expect(h.sim.actors.filter((a) => a.art === 'fix_scorch')).toHaveLength(0);
    expect(npcOn(h, 'halvar')).toBe(true);
  });

  it('raises the fold and byre for 250 silver; Hildr brings her flock down to the pasture', () => {
    const h = home(250);
    Object.assign(h.sim.state.flags, { st_farm_asked: true, q_farm: 1 });
    warp(h, 'ask_pasture', 20, 18);
    expect(sheep(h)).toBe(0);
    expect(npcOn(h, 'hildr')).toBe(false);
    warp(h, 'ask_farmyard', 20, 18);
    talkTo(h, 'halvar');
    expect(h.sim.state.flags.q_farm).toBe(2);
    expect(h.sim.state.hero.silver).toBe(0);
    expect(farm(h)?.done).toBe(true);
    warp(h, 'ask_farmyard', 20, 18);
    expect(h.sim.actors.filter((a) => a.art === 'fix_rubble')).toHaveLength(0);
    warp(h, 'ask_pasture', 20, 18);
    expect(sheep(h)).toBeGreaterThanOrEqual(5);
    expect(npcOn(h, 'hildr')).toBe(true);
    warp(h, 'hau_heath', 20, 18);
    expect(npcOn(h, 'hildr')).toBe(false);
  });

  it('takes nothing from a purse too light', () => {
    const h = home(100);
    Object.assign(h.sim.state.flags, { st_farm_asked: true, q_farm: 1 });
    warp(h, 'ask_farmyard', 20, 18);
    talkTo(h, 'halvar');
    expect(h.sim.state.flags.q_farm).toBe(1);
    expect(h.sim.state.hero.silver).toBe(100);
  });
});
